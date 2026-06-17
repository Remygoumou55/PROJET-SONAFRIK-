-- SONAFRIK — Sprint 13 · Rate Limiting sur RPCs sensibles
-- Fichier : supabase/migrations/20260617030000_rate_limits.sql

-- ---------------------------------------------------------------------------
-- Table : rate_limits
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier   TEXT NOT NULL,
  action       TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', now()),
  count        INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (identifier, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits(identifier, action, window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- FONCTION : check_rate_limit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier     TEXT,
  p_action         TEXT,
  p_max_count      INTEGER,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count        INTEGER;
BEGIN
  v_window_start := date_trunc('second', now())
    - (EXTRACT(EPOCH FROM now())::INTEGER % p_window_seconds) * INTERVAL '1 second';

  INSERT INTO public.rate_limits (identifier, action, window_start, count)
  VALUES (p_identifier, p_action, v_window_start, 1)
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1;

  SELECT count INTO v_count
  FROM public.rate_limits
  WHERE identifier   = p_identifier
    AND action       = p_action
    AND window_start = v_window_start;

  DELETE FROM public.rate_limits
  WHERE window_start < now() - (p_window_seconds * 2) * INTERVAL '1 second'
    AND identifier = p_identifier
    AND action     = p_action;

  RETURN v_count <= p_max_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- Recréer send_tip avec le rate limit
-- DROP obligatoire car PostgreSQL refuse le renommage de paramètre via REPLACE
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.send_tip(UUID, NUMERIC);

CREATE OR REPLACE FUNCTION public.send_tip(
  p_receiver_creator_id UUID,
  p_amount_gnf          NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id     UUID    := auth.uid();
  v_commission    NUMERIC;
  v_net_artiste   NUMERIC;
  v_creator_owner UUID;
  v_receiver_name TEXT;
  v_sender_wallet public.wallets%ROWTYPE;
  v_recv_wallet   public.wallets%ROWTYPE;
BEGIN
  -- 1. Auth
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- 2. Rate limit : max 10 pourboires/heure par utilisateur
  IF NOT public.check_rate_limit(v_sender_id::TEXT, 'send_tip', 10, 3600) THEN
    RAISE EXCEPTION 'rate_limit_exceeded';
  END IF;

  -- 3. Montant autorisé
  IF p_amount_gnf NOT IN (5000, 10000, 20000) THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  -- 4. Récupération du propriétaire du créateur
  SELECT owner_id INTO v_creator_owner
  FROM public.creators
  WHERE id = p_receiver_creator_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'receiver_not_found';
  END IF;

  -- 5. Pas de self-tip
  IF v_sender_id = v_creator_owner THEN
    RAISE EXCEPTION 'self_tip';
  END IF;

  -- 6. Commission interne (non exposée à l'UI)
  v_commission  := p_amount_gnf * 0.05;
  v_net_artiste := p_amount_gnf - v_commission;

  -- 7. Verrouillage + solde
  SELECT * INTO v_sender_wallet
  FROM public.wallets
  WHERE user_id = v_sender_id
  FOR UPDATE;

  IF NOT FOUND OR v_sender_wallet.balance_gnf < p_amount_gnf THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  SELECT * INTO v_recv_wallet
  FROM public.wallets
  WHERE user_id = v_creator_owner
  FOR UPDATE;

  -- 8. Débit expéditeur
  UPDATE public.wallets
  SET balance_gnf = balance_gnf - p_amount_gnf,
      updated_at  = now()
  WHERE user_id = v_sender_id;

  -- 9. Crédit artiste (montant net)
  UPDATE public.wallets
  SET balance_gnf = balance_gnf + v_net_artiste,
      updated_at  = now()
  WHERE user_id = v_creator_owner;

  -- 10. Transactions
  INSERT INTO public.transactions (
    user_id, wallet_id, type, status,
    amount_gnf, commission_gnf, net_amount_gnf,
    currency, payment_method, description, metadata, processed_at
  ) VALUES (
    v_sender_id, v_sender_wallet.id, 'tip', 'completed',
    p_amount_gnf, v_commission, v_net_artiste,
    'GNF', 'internal', 'Pourboire envoyé',
    jsonb_build_object('receiver_creator_id', p_receiver_creator_id), now()
  );

  INSERT INTO public.transactions (
    user_id, wallet_id, type, status,
    amount_gnf, commission_gnf, net_amount_gnf,
    currency, payment_method, description, metadata, processed_at
  ) VALUES (
    v_creator_owner, v_recv_wallet.id, 'tip', 'completed',
    v_net_artiste, 0, v_net_artiste,
    'GNF', 'internal', 'Pourboire reçu',
    jsonb_build_object('sender_id', v_sender_id), now()
  );

  -- 11. Ledger
  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf, reason, metadata
  ) VALUES (
    v_sender_wallet.id, v_sender_id, 'debit', p_amount_gnf,
    v_sender_wallet.balance_gnf - p_amount_gnf, 'tip',
    jsonb_build_object('receiver_creator_id', p_receiver_creator_id)
  );

  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf, reason, metadata
  ) VALUES (
    v_recv_wallet.id, v_creator_owner, 'credit', v_net_artiste,
    v_recv_wallet.balance_gnf + v_net_artiste, 'tip',
    jsonb_build_object('sender_id', v_sender_id)
  );

  -- 12. Audit
  PERFORM public.log_audit_event_authenticated(
    'wallet.tip_sent', 'tip', NULL,
    jsonb_build_object(
      'receiver_creator_id', p_receiver_creator_id,
      'amount_gnf',          p_amount_gnf
    )
  );

  -- 13. Nom artiste pour message UI
  SELECT full_name INTO v_receiver_name
  FROM public.profiles
  WHERE id = v_creator_owner;

  RETURN jsonb_build_object(
    'amount_sent',   p_amount_gnf,
    'net_received',  v_net_artiste,
    'receiver_name', COALESCE(v_receiver_name, 'Artiste')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.send_tip(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_tip(UUID, NUMERIC) TO authenticated;
