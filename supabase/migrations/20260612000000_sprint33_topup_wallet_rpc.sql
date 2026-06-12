-- Sprint 3.3 — Wallet Top-Up : RPC atomique, idempotente, ACID
-- Remplace les 3 opérations non-atomiques de la Edge Function wallet-topup
-- Intégrité financière complète : SELECT FOR UPDATE + transaction unique

-- ---------------------------------------------------------------------------
-- RPC : topup_wallet
-- Appelée par la Edge Function wallet-topup après validation du paiement.
-- Garantit : atomicité, idempotence, protection race condition.
-- ---------------------------------------------------------------------------
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
  -- Authentification
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Validation du montant
  IF p_amount_gnf < 1000 THEN
    RAISE EXCEPTION 'minimum_topup_1000_gnf';
  END IF;

  -- Validation de la méthode de paiement
  IF p_payment_method NOT IN ('orange_money', 'mtn_momo', 'wave', 'card', 'internal') THEN
    RAISE EXCEPTION 'invalid_payment_method : %', p_payment_method;
  END IF;

  -- -------------------------------------------------------------------------
  -- Idempotence : protège contre le double crédit sur la même référence
  -- -------------------------------------------------------------------------
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

  -- -------------------------------------------------------------------------
  -- Verrou exclusif — prévient toute modification concurrente du solde
  -- -------------------------------------------------------------------------
  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;

  -- -------------------------------------------------------------------------
  -- Étape 1 : créer la transaction (dans la même transaction SQL)
  -- -------------------------------------------------------------------------
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

  -- -------------------------------------------------------------------------
  -- Étape 2 : incrément atomique du solde (pas de read-modify-write)
  -- -------------------------------------------------------------------------
  UPDATE public.wallets
  SET balance_gnf        = balance_gnf + p_amount_gnf,
      total_credited_gnf = total_credited_gnf + p_amount_gnf
  WHERE user_id = v_user_id;

  -- -------------------------------------------------------------------------
  -- Étape 3 : entrée ledger immuable
  -- -------------------------------------------------------------------------
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

  -- -------------------------------------------------------------------------
  -- Les 3 étapes s'exécutent dans une seule transaction SQL.
  -- En cas d'échec à n'importe quelle étape, tout est rollbacké.
  -- -------------------------------------------------------------------------

  RETURN jsonb_build_object(
    'success',         true,
    'transaction_id',  v_tx_id,
    'new_balance_gnf', v_wallet.balance_gnf + p_amount_gnf,
    'idempotent',      false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.topup_wallet FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.topup_wallet TO authenticated;
