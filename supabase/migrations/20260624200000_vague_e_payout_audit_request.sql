-- Vague E — audit log à la demande de retrait + commentaire payout_batches actifs
-- Date : 2026-06-24

CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_payout_account_id UUID,
  p_amount_gnf NUMERIC
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet public.wallets%ROWTYPE;
  v_withdrawal_id UUID;
BEGIN
  IF p_amount_gnf < 5000 THEN
    RAISE EXCEPTION 'minimum_withdrawal_5000_gnf';
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.payout_accounts
    WHERE id = p_payout_account_id AND user_id = v_user_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'payout_account_not_found';
  END IF;

  IF v_wallet.balance_gnf < p_amount_gnf THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  UPDATE public.wallets
  SET balance_gnf       = balance_gnf - p_amount_gnf,
      total_debited_gnf = total_debited_gnf + p_amount_gnf
  WHERE user_id = v_user_id;

  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf, reason, metadata
  ) VALUES (
    v_wallet.id, v_user_id, 'debit', p_amount_gnf,
    v_wallet.balance_gnf - p_amount_gnf,
    'withdrawal',
    jsonb_build_object('payout_account_id', p_payout_account_id)
  );

  INSERT INTO public.withdrawals (
    user_id, wallet_id, payout_account_id, amount_gnf, fee_gnf, net_amount_gnf
  ) VALUES (
    v_user_id, v_wallet.id, p_payout_account_id, p_amount_gnf, 0, p_amount_gnf
  )
  RETURNING id INTO v_withdrawal_id;

  INSERT INTO public.payout_audit_logs (
    withdrawal_id, action, performed_by, previous_status, new_status
  ) VALUES (
    v_withdrawal_id, 'requested', v_user_id, NULL, 'pending'
  );

  RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.payout_batches IS 'Lots de retrait admin — actif depuis Vague E';
COMMENT ON TABLE public.payout_audit_logs IS 'Journal immuable des actions payout — inclut requested depuis Vague E';
