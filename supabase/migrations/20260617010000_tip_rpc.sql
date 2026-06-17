-- SONAFRIK — Sprint G-3 · Pourboire artiste (CDC Règle #5)
-- RPC send_tip : transfère p_amount_gnf depuis auth.uid() vers l'artiste
-- Commission 5% INTERNE — jamais exposée à l'UI ni dans le JSONB de retour.

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
  -- 1. Vérification auth
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- 2. Vérification montant (valeurs autorisées uniquement)
  IF p_amount_gnf NOT IN (5000, 10000, 20000) THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  -- 3. Récupération du propriétaire du créateur destinataire
  SELECT owner_id INTO v_creator_owner
  FROM public.creators
  WHERE id = p_receiver_creator_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'receiver_not_found';
  END IF;

  -- 4. Pas de self-tip
  IF v_sender_id = v_creator_owner THEN
    RAISE EXCEPTION 'self_tip';
  END IF;

  -- 5. Calcul commission interne (non exposée à l'UI)
  v_commission  := p_amount_gnf * 0.05;
  v_net_artiste := p_amount_gnf - v_commission;

  -- 6. Verrouillage + vérification solde expéditeur
  SELECT * INTO v_sender_wallet
  FROM public.wallets
  WHERE user_id = v_sender_id
  FOR UPDATE;

  IF NOT FOUND OR v_sender_wallet.balance_gnf < p_amount_gnf THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Verrouillage wallet destinataire
  SELECT * INTO v_recv_wallet
  FROM public.wallets
  WHERE user_id = v_creator_owner
  FOR UPDATE;

  -- 7. Débit expéditeur
  UPDATE public.wallets
  SET balance_gnf = balance_gnf - p_amount_gnf,
      updated_at  = now()
  WHERE user_id = v_sender_id;

  -- 8. Crédit artiste (montant net)
  UPDATE public.wallets
  SET balance_gnf = balance_gnf + v_net_artiste,
      updated_at  = now()
  WHERE user_id = v_creator_owner;

  -- 9. Transaction expéditeur (débit)
  INSERT INTO public.transactions (
    user_id, wallet_id, type, status,
    amount_gnf, commission_gnf, net_amount_gnf,
    currency, payment_method, description, metadata, processed_at
  ) VALUES (
    v_sender_id, v_sender_wallet.id, 'tip', 'completed',
    p_amount_gnf, v_commission, v_net_artiste,
    'GNF', 'internal',
    'Pourboire envoyé',
    jsonb_build_object('receiver_creator_id', p_receiver_creator_id),
    now()
  );

  -- Transaction destinataire (crédit)
  INSERT INTO public.transactions (
    user_id, wallet_id, type, status,
    amount_gnf, commission_gnf, net_amount_gnf,
    currency, payment_method, description, metadata, processed_at
  ) VALUES (
    v_creator_owner, v_recv_wallet.id, 'tip', 'completed',
    v_net_artiste, 0, v_net_artiste,
    'GNF', 'internal',
    'Pourboire reçu',
    jsonb_build_object('sender_id', v_sender_id),
    now()
  );

  -- 10. Ledger expéditeur (débit)
  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf, reason, metadata
  ) VALUES (
    v_sender_wallet.id, v_sender_id, 'debit', p_amount_gnf,
    v_sender_wallet.balance_gnf - p_amount_gnf,
    'tip',
    jsonb_build_object('receiver_creator_id', p_receiver_creator_id)
  );

  -- Ledger destinataire (crédit)
  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf, reason, metadata
  ) VALUES (
    v_recv_wallet.id, v_creator_owner, 'credit', v_net_artiste,
    v_recv_wallet.balance_gnf + v_net_artiste,
    'tip',
    jsonb_build_object('sender_id', v_sender_id)
  );

  -- 11. Audit
  PERFORM public.log_audit_event_authenticated(
    'wallet.tip_sent',
    'tip',
    NULL,
    jsonb_build_object(
      'receiver_creator_id', p_receiver_creator_id,
      'amount_gnf',          p_amount_gnf
    )
  );

  -- 12. Nom de l'artiste (pour message de confirmation UI)
  SELECT full_name INTO v_receiver_name
  FROM public.profiles
  WHERE id = v_creator_owner;

  -- 13. Retour — NE PAS inclure commission, 5%, frais, ni net_received dans l'UI
  RETURN jsonb_build_object(
    'amount_sent',   p_amount_gnf,
    'net_received',  v_net_artiste,
    'receiver_name', COALESCE(v_receiver_name, 'Artiste')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.send_tip(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_tip(UUID, NUMERIC) TO authenticated;

-- TEST (à exécuter manuellement avec un user authentifié ayant du solde) :
-- SELECT send_tip('<uuid-creator>', 5000);
-- → doit retourner {"amount_sent": 5000, "net_received": 4750, "receiver_name": "..."}
-- SELECT send_tip('<uuid-creator>', 3000);
-- → doit RAISE 'invalid_amount'
-- SELECT send_tip('<uuid-creator>', 5000) avec solde insuffisant;
-- → doit RAISE 'insufficient_balance'
