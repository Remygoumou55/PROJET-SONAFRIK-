-- Vague A — Sécurité wallet + RPC notifications manquante

-- ---------------------------------------------------------------------------
-- 1. topup_wallet : réservé au service_role (crédit via confirm_payment_intent)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.topup_wallet(NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.topup_wallet(NUMERIC, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.topup_wallet(NUMERIC, TEXT, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.topup_wallet(
  p_amount_gnf         NUMERIC,
  p_payment_method     TEXT,
  p_payment_reference  TEXT    DEFAULT NULL,
  p_description        TEXT    DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet  public.wallets%ROWTYPE;
  v_tx_id   UUID;
  v_dup_id  UUID;
BEGIN
  -- Bloquer les appels JWT utilisateur (authenticated) — crédit via confirm_payment_intent
  IF auth.role() = 'authenticated' THEN
    RAISE EXCEPTION 'topup_wallet_use_payment_flow';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_amount_gnf < 1000 THEN
    RAISE EXCEPTION 'minimum_topup_1000_gnf';
  END IF;

  IF p_payment_method NOT IN ('orange_money', 'mtn_momo', 'wave', 'card') THEN
    RAISE EXCEPTION 'invalid_payment_method : %', p_payment_method;
  END IF;

  IF p_payment_reference IS NOT NULL AND p_payment_reference <> '' THEN
    SELECT id INTO v_dup_id
    FROM public.transactions
    WHERE user_id           = v_user_id
      AND payment_reference = p_payment_reference
      AND type              = 'topup'
      AND status            = 'completed'
    LIMIT 1;

    IF v_dup_id IS NOT NULL THEN
      SELECT balance_gnf INTO v_wallet.balance_gnf
      FROM public.wallets WHERE user_id = v_user_id;

      RETURN jsonb_build_object(
        'success',         true,
        'transaction_id',  v_dup_id,
        'new_balance_gnf', v_wallet.balance_gnf,
        'idempotent',      true
      );
    END IF;
  END IF;

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;

  INSERT INTO public.transactions (
    user_id, wallet_id, type, status,
    amount_gnf, commission_gnf, net_amount_gnf,
    currency, payment_method, payment_reference,
    description, processed_at
  ) VALUES (
    v_user_id, v_wallet.id, 'topup', 'completed',
    p_amount_gnf, 0, p_amount_gnf,
    'GNF', p_payment_method, p_payment_reference,
    COALESCE(p_description, 'Recharge portefeuille — ' || p_payment_method),
    now()
  )
  RETURNING id INTO v_tx_id;

  UPDATE public.wallets
  SET balance_gnf        = balance_gnf + p_amount_gnf,
      total_credited_gnf = total_credited_gnf + p_amount_gnf
  WHERE user_id = v_user_id;

  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf,
    balance_after_gnf, reason,
    reference_id, reference_type, metadata
  ) VALUES (
    v_wallet.id, v_user_id, 'credit', p_amount_gnf,
    v_wallet.balance_gnf + p_amount_gnf,
    'topup',
    v_tx_id, 'transactions',
    jsonb_build_object(
      'payment_method',    p_payment_method,
      'payment_reference', p_payment_reference
    )
  );

  RETURN jsonb_build_object(
    'success',         true,
    'transaction_id',  v_tx_id,
    'new_balance_gnf', v_wallet.balance_gnf + p_amount_gnf,
    'idempotent',      false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- 2. count_unread_notifications — RPC appelée par notifications.repository
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_unread_notifications()
RETURNS INTEGER AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  RETURN (
    SELECT count(*)::INTEGER
    FROM public.notifications
    WHERE user_id = auth.uid()
      AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.count_unread_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_unread_notifications() TO authenticated;
