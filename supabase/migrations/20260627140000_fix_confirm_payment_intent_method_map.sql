-- Fix CRITIQUE : confirm_payment_intent utilisait payment_intents.provider (orange_money_gn)
-- comme transactions.payment_method, violant transactions_payment_method_check.
BEGIN;

CREATE OR REPLACE FUNCTION public.map_intent_provider_to_payment_method(p_provider TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_provider
    WHEN 'orange_money_gn' THEN 'orange_money'
    WHEN 'mtn_momo_gn'     THEN 'mtn_momo'
    WHEN 'wave_gn'         THEN 'wave'
    WHEN 'soutra_money'    THEN 'internal'
    ELSE 'internal'
  END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_payment_intent(
  p_intent_id    UUID,
  p_provider_ref TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent      public.payment_intents%ROWTYPE;
  v_wallet      public.wallets%ROWTYPE;
  v_tx_id       UUID;
  v_dup_tx_id   UUID;
  v_new_balance NUMERIC;
  v_payment_method TEXT;
BEGIN
  SELECT * INTO v_intent
  FROM public.payment_intents
  WHERE id = p_intent_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'intent_not_found';
  END IF;

  IF v_intent.status = 'confirmed' THEN
    SELECT balance_gnf INTO v_new_balance
    FROM public.wallets WHERE id = v_intent.wallet_id;
    RETURN jsonb_build_object(
      'wallet_id',   v_intent.wallet_id,
      'new_balance', v_new_balance,
      'idempotent',  true
    );
  END IF;

  IF v_intent.status NOT IN ('initiated', 'pending') THEN
    RAISE EXCEPTION 'intent_not_confirmable : statut %', v_intent.status;
  END IF;

  IF v_intent.expires_at < now() THEN
    UPDATE public.payment_intents
    SET status = 'expired', updated_at = now()
    WHERE id = p_intent_id;
    RAISE EXCEPTION 'expired';
  END IF;

  v_payment_method := public.map_intent_provider_to_payment_method(v_intent.provider);

  UPDATE public.payment_intents
  SET status       = 'confirmed',
      provider_ref = p_provider_ref,
      confirmed_at = now(),
      updated_at   = now()
  WHERE id = p_intent_id;

  IF v_intent.purpose = 'topup' THEN
    SELECT id INTO v_dup_tx_id
    FROM public.transactions
    WHERE payment_reference = p_intent_id::TEXT
      AND type              = 'topup'
      AND status            = 'completed'
    LIMIT 1;

    IF v_dup_tx_id IS NOT NULL THEN
      SELECT balance_gnf INTO v_new_balance FROM public.wallets WHERE id = v_intent.wallet_id;
      RETURN jsonb_build_object('wallet_id', v_intent.wallet_id, 'new_balance', v_new_balance, 'idempotent', true);
    END IF;

    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE id = v_intent.wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'wallet_not_found';
    END IF;

    INSERT INTO public.transactions (
      user_id, wallet_id, type, status,
      amount_gnf, commission_gnf, net_amount_gnf,
      currency, payment_method, payment_reference,
      description, metadata, processed_at
    ) VALUES (
      v_intent.user_id, v_intent.wallet_id, 'topup', 'completed',
      v_intent.amount_gnf, 0, v_intent.amount_gnf,
      'GNF', v_payment_method, p_intent_id::TEXT,
      'Recharge via ' || v_intent.provider,
      jsonb_build_object(
        'intent_id',    p_intent_id,
        'provider',     v_intent.provider,
        'provider_ref', p_provider_ref,
        'phone',        v_intent.provider_phone
      ),
      now()
    ) RETURNING id INTO v_tx_id;

    UPDATE public.wallets
    SET balance_gnf        = balance_gnf + v_intent.amount_gnf,
        total_credited_gnf = total_credited_gnf + v_intent.amount_gnf,
        updated_at         = now()
    WHERE id = v_intent.wallet_id;

    INSERT INTO public.wallet_ledger (
      wallet_id, user_id, entry_type, amount_gnf,
      balance_after_gnf, reason, reference_id, reference_type, metadata
    ) VALUES (
      v_intent.wallet_id, v_intent.user_id, 'credit', v_intent.amount_gnf,
      v_wallet.balance_gnf + v_intent.amount_gnf,
      'topup',
      v_tx_id, 'transactions',
      jsonb_build_object('provider', v_intent.provider, 'intent_id', p_intent_id)
    );

    PERFORM public.log_audit_event(
      v_intent.user_id,
      'wallet.topup_confirmed',
      'payment_intent',
      p_intent_id,
      jsonb_build_object(
        'provider',     v_intent.provider,
        'amount_gnf',   v_intent.amount_gnf,
        'provider_ref', p_provider_ref
      )
    );

    v_new_balance := v_wallet.balance_gnf + v_intent.amount_gnf;
  ELSE
    v_new_balance := (SELECT balance_gnf FROM public.wallets WHERE id = v_intent.wallet_id);
  END IF;

  RETURN jsonb_build_object(
    'wallet_id',   v_intent.wallet_id,
    'new_balance', v_new_balance,
    'idempotent',  false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_payment_intent(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_payment_intent(UUID, TEXT) TO service_role;

COMMIT;
