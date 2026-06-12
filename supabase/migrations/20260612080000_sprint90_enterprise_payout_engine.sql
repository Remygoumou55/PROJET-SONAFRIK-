-- Sprint 9.0 — Enterprise Payout Engine
-- SONAFRIK CDC V9.0
--
-- Depends on:
--   • 20250610150000_sprint8_wallet_os.sql   → wallets, wallet_ledger, withdrawals, payout_accounts
--   • 20260612070000_sprint80_royalty_engine_enterprise.sql → _assert_admin()
--
-- What this migration adds:
--   1. ALTER withdrawals  → add 'approved' to status CHECK constraint
--   2. ALTER withdrawals  → add batch_id column
--   3. CREATE payout_batches table
--   4. CREATE payout_audit_logs table
--   5. RLS on new tables
--   6. Admin RPCs: approve, reject, process, mark_paid, cancel
--   7. Creator RPCs: get_user_payouts, get_payout_summary
--   8. Admin RPCs: get_admin_payout_queue, create_payout_batch
--   9. Indexes
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- 1. ALTER withdrawals — add 'approved' to status CHECK constraint (idempotent)
-- ===========================================================================
-- Drop the auto-named inline CHECK constraint and recreate with 'approved'
ALTER TABLE public.withdrawals
  DROP CONSTRAINT IF EXISTS withdrawals_status_check;

ALTER TABLE public.withdrawals
  ADD CONSTRAINT withdrawals_status_check CHECK (status IN (
    'pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'
  ));

-- ===========================================================================
-- 2. payout_batches — groupes de virements administratifs
-- ===========================================================================
CREATE TABLE public.payout_batches (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT          NOT NULL,
  status         TEXT          NOT NULL DEFAULT 'open' CHECK (status IN (
                                 'open', 'processing', 'completed', 'closed'
                               )),
  created_by     UUID          NOT NULL REFERENCES auth.users(id),
  total_amount_gnf NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_amount_gnf >= 0),
  withdrawal_count INTEGER     NOT NULL DEFAULT 0 CHECK (withdrawal_count >= 0),
  processed_at   TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER payout_batches_set_updated_at
  BEFORE UPDATE ON public.payout_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- 3. payout_audit_logs — journal immuable de chaque action admin
-- ===========================================================================
CREATE TABLE public.payout_audit_logs (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id  UUID    NOT NULL REFERENCES public.withdrawals(id) ON DELETE CASCADE,
  action         TEXT    NOT NULL CHECK (action IN (
                           'requested', 'approved', 'rejected',
                           'processing', 'paid', 'cancelled', 'batch_assigned'
                         )),
  performed_by   UUID    NOT NULL REFERENCES auth.users(id),
  previous_status TEXT,
  new_status     TEXT    NOT NULL,
  reason         TEXT,
  metadata       JSONB   NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payout_audit_withdrawal   ON public.payout_audit_logs(withdrawal_id);
CREATE INDEX idx_payout_audit_performed_by ON public.payout_audit_logs(performed_by);
CREATE INDEX idx_payout_audit_created_at   ON public.payout_audit_logs(created_at DESC);

-- ===========================================================================
-- 4. ALTER withdrawals — add batch_id (FK à payout_batches)
-- ===========================================================================
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.payout_batches(id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_batch_id
  ON public.withdrawals(batch_id) WHERE batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status
  ON public.withdrawals(user_id, status);

CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at
  ON public.withdrawals(created_at DESC);

-- ===========================================================================
-- 5. RLS
-- ===========================================================================
ALTER TABLE public.payout_batches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_audit_logs ENABLE ROW LEVEL SECURITY;

-- payout_batches : admin only
CREATE POLICY "payout_batches_admin" ON public.payout_batches
  USING (public.is_admin(auth.uid()));

-- payout_audit_logs : utilisateur voit les logs de ses propres retraits ; admin voit tout
CREATE POLICY "payout_audit_select_own" ON public.payout_audit_logs
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.withdrawals w
      WHERE w.id = withdrawal_id
        AND w.user_id = auth.uid()
    )
  );

-- ===========================================================================
-- 6. Admin RPCs
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- approve_payout_request : pending → approved
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_payout_request(
  p_withdrawal_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  PERFORM public._assert_admin();

  SELECT * INTO v_withdrawal
  FROM public.withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'withdrawal_not_found';
  END IF;

  IF v_withdrawal.status <> 'pending' THEN
    RAISE EXCEPTION 'withdrawal_must_be_pending — current status: %', v_withdrawal.status;
  END IF;

  UPDATE public.withdrawals
  SET status       = 'approved',
      processed_by = auth.uid(),
      updated_at   = now()
  WHERE id = p_withdrawal_id;

  INSERT INTO public.payout_audit_logs (
    withdrawal_id, action, performed_by, previous_status, new_status
  ) VALUES (
    p_withdrawal_id, 'approved', auth.uid(), 'pending', 'approved'
  );

  RETURN jsonb_build_object(
    'withdrawal_id', p_withdrawal_id,
    'status', 'approved'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- reject_payout_request : pending | approved → cancelled + remboursement wallet
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reject_payout_request(
  p_withdrawal_id UUID,
  p_reason        TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
  v_wallet     public.wallets%ROWTYPE;
  v_prev_status TEXT;
BEGIN
  PERFORM public._assert_admin();

  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'rejection_reason_required';
  END IF;

  SELECT * INTO v_withdrawal
  FROM public.withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'withdrawal_not_found';
  END IF;

  IF v_withdrawal.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'withdrawal_must_be_pending_or_approved — current status: %', v_withdrawal.status;
  END IF;

  v_prev_status := v_withdrawal.status;

  -- Verrouiller et récupérer le wallet pour le remboursement
  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE id = v_withdrawal.wallet_id
  FOR UPDATE;

  -- Remboursement : annule le débit initial
  UPDATE public.wallets
  SET balance_gnf       = balance_gnf       + v_withdrawal.amount_gnf,
      total_debited_gnf = GREATEST(total_debited_gnf - v_withdrawal.amount_gnf, 0),
      updated_at        = now()
  WHERE id = v_withdrawal.wallet_id;

  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf,
    reason, reference_id, reference_type, metadata
  ) VALUES (
    v_wallet.id,
    v_withdrawal.user_id,
    'credit',
    v_withdrawal.amount_gnf,
    v_wallet.balance_gnf + v_withdrawal.amount_gnf,
    'refund',
    p_withdrawal_id,
    'withdrawal',
    jsonb_build_object('action', 'rejection', 'reason', p_reason)
  );

  UPDATE public.withdrawals
  SET status           = 'cancelled',
      rejection_reason = p_reason,
      processed_by     = auth.uid(),
      processed_at     = now(),
      updated_at       = now()
  WHERE id = p_withdrawal_id;

  INSERT INTO public.payout_audit_logs (
    withdrawal_id, action, performed_by, previous_status, new_status, reason
  ) VALUES (
    p_withdrawal_id, 'rejected', auth.uid(), v_prev_status, 'cancelled', p_reason
  );

  RETURN jsonb_build_object(
    'withdrawal_id',  p_withdrawal_id,
    'status',         'cancelled',
    'reason',         p_reason,
    'refunded_gnf',   v_withdrawal.amount_gnf
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- process_payout_request : approved → processing (avec batch optionnel)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_payout_request(
  p_withdrawal_id UUID,
  p_batch_id      UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  PERFORM public._assert_admin();

  SELECT * INTO v_withdrawal
  FROM public.withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'withdrawal_not_found';
  END IF;

  IF v_withdrawal.status <> 'approved' THEN
    RAISE EXCEPTION 'withdrawal_must_be_approved — current status: %', v_withdrawal.status;
  END IF;

  IF p_batch_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.payout_batches
      WHERE id = p_batch_id AND status IN ('open', 'processing')
    ) THEN
      RAISE EXCEPTION 'batch_not_found_or_closed';
    END IF;
  END IF;

  UPDATE public.withdrawals
  SET status       = 'processing',
      batch_id     = COALESCE(p_batch_id, batch_id),
      processed_by = auth.uid(),
      updated_at   = now()
  WHERE id = p_withdrawal_id;

  IF p_batch_id IS NOT NULL THEN
    UPDATE public.payout_batches
    SET withdrawal_count = withdrawal_count + 1,
        total_amount_gnf = total_amount_gnf + v_withdrawal.net_amount_gnf,
        status           = 'processing',
        updated_at       = now()
    WHERE id = p_batch_id;
  END IF;

  INSERT INTO public.payout_audit_logs (
    withdrawal_id, action, performed_by, previous_status, new_status, metadata
  ) VALUES (
    p_withdrawal_id, 'processing', auth.uid(), 'approved', 'processing',
    CASE WHEN p_batch_id IS NOT NULL
      THEN jsonb_build_object('batch_id', p_batch_id)
      ELSE '{}'::jsonb
    END
  );

  RETURN jsonb_build_object(
    'withdrawal_id', p_withdrawal_id,
    'status',        'processing',
    'batch_id',      p_batch_id
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- mark_payout_paid : processing → completed
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_payout_paid(
  p_withdrawal_id UUID,
  p_reference     TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  PERFORM public._assert_admin();

  IF p_reference IS NULL OR length(trim(p_reference)) = 0 THEN
    RAISE EXCEPTION 'payment_reference_required';
  END IF;

  SELECT * INTO v_withdrawal
  FROM public.withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'withdrawal_not_found';
  END IF;

  IF v_withdrawal.status <> 'processing' THEN
    RAISE EXCEPTION 'withdrawal_must_be_processing — current status: %', v_withdrawal.status;
  END IF;

  UPDATE public.withdrawals
  SET status       = 'completed',
      reference    = trim(p_reference),
      processed_at = now(),
      updated_at   = now()
  WHERE id = p_withdrawal_id;

  INSERT INTO public.payout_audit_logs (
    withdrawal_id, action, performed_by, previous_status, new_status, metadata
  ) VALUES (
    p_withdrawal_id, 'paid', auth.uid(), 'processing', 'completed',
    jsonb_build_object('reference', p_reference)
  );

  RETURN jsonb_build_object(
    'withdrawal_id', p_withdrawal_id,
    'status',        'completed',
    'reference',     p_reference
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- cancel_payout_request : pending | approved | processing → cancelled + remboursement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_payout_request(
  p_withdrawal_id UUID,
  p_reason        TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
  v_wallet     public.wallets%ROWTYPE;
  v_prev_status TEXT;
  v_reason      TEXT;
BEGIN
  PERFORM public._assert_admin();

  SELECT * INTO v_withdrawal
  FROM public.withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'withdrawal_not_found';
  END IF;

  IF v_withdrawal.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'cannot_cancel — current status: %', v_withdrawal.status;
  END IF;

  v_prev_status := v_withdrawal.status;
  v_reason      := COALESCE(trim(p_reason), 'Annulé par l''administrateur');

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE id = v_withdrawal.wallet_id
  FOR UPDATE;

  UPDATE public.wallets
  SET balance_gnf       = balance_gnf       + v_withdrawal.amount_gnf,
      total_debited_gnf = GREATEST(total_debited_gnf - v_withdrawal.amount_gnf, 0),
      updated_at        = now()
  WHERE id = v_withdrawal.wallet_id;

  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf,
    reason, reference_id, reference_type, metadata
  ) VALUES (
    v_wallet.id,
    v_withdrawal.user_id,
    'credit',
    v_withdrawal.amount_gnf,
    v_wallet.balance_gnf + v_withdrawal.amount_gnf,
    'refund',
    p_withdrawal_id,
    'withdrawal',
    jsonb_build_object('action', 'cancellation', 'reason', v_reason)
  );

  UPDATE public.withdrawals
  SET status           = 'cancelled',
      rejection_reason = v_reason,
      processed_by     = auth.uid(),
      processed_at     = now(),
      updated_at       = now()
  WHERE id = p_withdrawal_id;

  INSERT INTO public.payout_audit_logs (
    withdrawal_id, action, performed_by, previous_status, new_status, reason
  ) VALUES (
    p_withdrawal_id, 'cancelled', auth.uid(), v_prev_status, 'cancelled', v_reason
  );

  RETURN jsonb_build_object(
    'withdrawal_id', p_withdrawal_id,
    'status',        'cancelled',
    'refunded_gnf',  v_withdrawal.amount_gnf
  );
END;
$$;

-- ===========================================================================
-- 7. Creator RPCs
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- get_user_payouts : historique retraits de l'utilisateur connecté (avec compte)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_payouts(
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row ORDER BY (row->>'created_at') DESC), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
        'id',               w.id,
        'amount_gnf',       w.amount_gnf,
        'fee_gnf',          w.fee_gnf,
        'net_amount_gnf',   w.net_amount_gnf,
        'status',           w.status,
        'reference',        w.reference,
        'rejection_reason', w.rejection_reason,
        'created_at',       w.created_at,
        'processed_at',     w.processed_at,
        'payout_account', jsonb_build_object(
          'id',           pa.id,
          'type',         pa.type,
          'display_name', pa.display_name,
          'phone_number', pa.phone_number
        )
      ) AS row
      FROM public.withdrawals w
      LEFT JOIN public.payout_accounts pa ON pa.id = w.payout_account_id
      WHERE w.user_id = v_user_id
      ORDER BY w.created_at DESC
      LIMIT LEAST(p_limit, 100)
    ) sub
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- get_payout_summary : statistiques retraits de l'utilisateur connecté
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_payout_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'total_withdrawn_gnf',
        COALESCE(SUM(CASE WHEN status = 'completed' THEN net_amount_gnf ELSE 0 END), 0),
      'pending_gnf',
        COALESCE(SUM(CASE WHEN status IN ('pending', 'approved', 'processing') THEN amount_gnf ELSE 0 END), 0),
      'completed_count',
        COUNT(CASE WHEN status = 'completed' THEN 1 END),
      'pending_count',
        COUNT(CASE WHEN status IN ('pending', 'approved', 'processing') THEN 1 END),
      'cancelled_count',
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END),
      'total_fees_gnf',
        COALESCE(SUM(CASE WHEN status = 'completed' THEN fee_gnf ELSE 0 END), 0)
    )
    FROM public.withdrawals
    WHERE user_id = v_user_id
  );
END;
$$;

-- ===========================================================================
-- 8. Admin RPCs — file d'attente et gestion de lots
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- get_admin_payout_queue : liste des retraits avec détails compte + utilisateur
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_payout_queue(
  p_status TEXT    DEFAULT 'pending',
  p_limit  INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._assert_admin();

  RETURN (
    SELECT COALESCE(jsonb_agg(row ORDER BY (row->>'created_at') ASC), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
        'id',               w.id,
        'user_id',          w.user_id,
        'amount_gnf',       w.amount_gnf,
        'fee_gnf',          w.fee_gnf,
        'net_amount_gnf',   w.net_amount_gnf,
        'status',           w.status,
        'reference',        w.reference,
        'rejection_reason', w.rejection_reason,
        'created_at',       w.created_at,
        'processed_at',     w.processed_at,
        'batch_id',         w.batch_id,
        'payout_account', jsonb_build_object(
          'id',                  pa.id,
          'type',                pa.type,
          'display_name',        pa.display_name,
          'phone_number',        pa.phone_number,
          'iban',                pa.iban,
          'bank_name',           pa.bank_name,
          'account_holder_name', pa.account_holder_name
        ),
        'user_email', u.email
      ) AS row
      FROM public.withdrawals w
      LEFT JOIN public.payout_accounts pa ON pa.id = w.payout_account_id
      LEFT JOIN auth.users u ON u.id = w.user_id
      WHERE (p_status = 'all' OR w.status = p_status)
      ORDER BY w.created_at ASC
      LIMIT LEAST(p_limit, 200)
    ) sub
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- create_payout_batch : créer un lot de virements
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_payout_batch(
  p_name  TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID;
BEGIN
  PERFORM public._assert_admin();

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'batch_name_required';
  END IF;

  INSERT INTO public.payout_batches (name, notes, created_by)
  VALUES (trim(p_name), p_notes, auth.uid())
  RETURNING id INTO v_batch_id;

  RETURN v_batch_id;
END;
$$;

-- ===========================================================================
-- 9. REVOKE / GRANT (security hardening)
-- ===========================================================================
REVOKE ALL ON FUNCTION public.approve_payout_request(UUID)        FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_payout_request(UUID, TEXT)   FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_payout_request(UUID, UUID)  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_payout_paid(UUID, TEXT)        FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_payout_request(UUID, TEXT)   FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_payout_queue(TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_payout_batch(TEXT, TEXT)     FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_payouts(INTEGER)           FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_payout_summary()                FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.approve_payout_request(UUID)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payout_request(UUID, TEXT)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payout_request(UUID, UUID)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_payout_paid(UUID, TEXT)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_payout_request(UUID, TEXT)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_payout_queue(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_payout_batch(TEXT, TEXT)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_payouts(INTEGER)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payout_summary()                TO authenticated;
