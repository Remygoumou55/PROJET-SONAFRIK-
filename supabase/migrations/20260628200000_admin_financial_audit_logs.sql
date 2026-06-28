-- Sprint Admin 3 — audit_logs sur actions financières admin (retraits + royalties)

BEGIN;

-- approve_payout_request : journal audit central
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

  PERFORM public.log_audit_event_authenticated(
    'withdrawal_approved',
    'withdrawal',
    p_withdrawal_id,
    jsonb_build_object(
      'amount_gnf', v_withdrawal.amount_gnf,
      'net_amount_gnf', v_withdrawal.net_amount_gnf,
      'user_id', v_withdrawal.user_id
    )
  );

  RETURN jsonb_build_object(
    'withdrawal_id', p_withdrawal_id,
    'status', 'approved'
  );
END;
$$;

-- reject_payout_request : journal audit central
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

  PERFORM public.log_audit_event_authenticated(
    'withdrawal_rejected',
    'withdrawal',
    p_withdrawal_id,
    jsonb_build_object(
      'amount_gnf', v_withdrawal.amount_gnf,
      'user_id', v_withdrawal.user_id,
      'reason', p_reason,
      'refunded_gnf', v_withdrawal.amount_gnf
    )
  );

  RETURN jsonb_build_object(
    'withdrawal_id',  p_withdrawal_id,
    'status',         'cancelled',
    'reason',         p_reason,
    'refunded_gnf',   v_withdrawal.amount_gnf
  );
END;
$$;

-- distribute_royalties : journal audit cycle
CREATE OR REPLACE FUNCTION public.distribute_royalties(
  p_cycle_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle       public.royalty_cycles%ROWTYPE;
  v_calc        RECORD;
  v_wallet      public.wallets%ROWTYPE;
  v_distributed INTEGER := 0;
  v_total_gnf   NUMERIC := 0;
BEGIN
  PERFORM public._assert_admin();

  SELECT * INTO v_cycle
  FROM public.royalty_cycles
  WHERE id = p_cycle_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle introuvable : %', p_cycle_id;
  END IF;

  IF v_cycle.status NOT IN ('ready', 'distributed') THEN
    RAISE EXCEPTION 'Le cycle doit être en statut ready ou distributed (actuel : %).', v_cycle.status;
  END IF;

  FOR v_calc IN
    SELECT rc.*
    FROM public.royalty_calculations rc
    WHERE rc.cycle_id      = p_cycle_id
      AND rc.status        IN ('pending', 'approved')
      AND rc.net_amount_gnf > 0
    ORDER BY rc.net_amount_gnf DESC
    FOR UPDATE OF rc
  LOOP
    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE user_id = v_calc.artist_id
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    UPDATE public.wallets
    SET balance_gnf        = balance_gnf        + v_calc.net_amount_gnf,
        total_credited_gnf = total_credited_gnf + v_calc.net_amount_gnf
    WHERE user_id = v_calc.artist_id;

    INSERT INTO public.wallet_ledger (
      wallet_id, user_id, entry_type,
      amount_gnf, balance_after_gnf,
      reason, reference_id, reference_type, metadata
    ) VALUES (
      v_wallet.id,
      v_calc.artist_id,
      'credit',
      v_calc.net_amount_gnf,
      v_wallet.balance_gnf + v_calc.net_amount_gnf,
      'royalty',
      v_calc.id,
      'royalty_calculation',
      jsonb_build_object(
        'cycle_id',             p_cycle_id,
        'period_start',         v_cycle.period_start::TEXT,
        'period_end',           v_cycle.period_end::TEXT,
        'valid_listen_count',   v_calc.valid_listen_count,
        'listen_share_percent', v_calc.listen_share_percent,
        'creator_id',           v_calc.creator_id
      )
    );

    INSERT INTO public.transactions (
      user_id, wallet_id, type, status,
      amount_gnf, commission_gnf, net_amount_gnf,
      payment_method, description, processed_at
    ) VALUES (
      v_calc.artist_id,
      v_wallet.id,
      'royalty_payout',
      'completed',
      v_calc.net_amount_gnf,
      v_calc.platform_commission_gnf,
      v_calc.net_amount_gnf,
      'internal',
      format(
        'Royalties %s – %s · %s écoutes valides · %.4f%%',
        to_char(v_cycle.period_start, 'DD/MM/YYYY'),
        to_char(v_cycle.period_end,   'DD/MM/YYYY'),
        v_calc.valid_listen_count,
        v_calc.listen_share_percent
      ),
      now()
    );

    UPDATE public.royalty_calculations
    SET status  = 'paid',
        paid_at = now()
    WHERE id = v_calc.id;

    v_distributed := v_distributed + 1;
    v_total_gnf   := v_total_gnf + v_calc.net_amount_gnf;
  END LOOP;

  UPDATE public.royalty_cycles
  SET status         = 'distributed',
      distributed_at = COALESCE(distributed_at, now())
  WHERE id = p_cycle_id;

  PERFORM public.log_audit_event_authenticated(
    'royalty_cycle_distributed',
    'royalty_cycle',
    p_cycle_id,
    jsonb_build_object(
      'distributed_count', v_distributed,
      'total_gnf', v_total_gnf,
      'period_start', v_cycle.period_start,
      'period_end', v_cycle.period_end
    )
  );

  RETURN jsonb_build_object(
    'cycle_id',          p_cycle_id,
    'distributed_count', v_distributed,
    'total_gnf',         v_total_gnf,
    'status',            'distributed'
  );
END;
$$;

COMMIT;
