-- Fix: PostgreSQL format() ne supporte pas %.4f — utiliser round() + %s
BEGIN;

CREATE OR REPLACE FUNCTION public.distribute_royalties(p_cycle_id UUID)
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
        'Royalties %s – %s · %s écoutes valides · %s%%',
        to_char(v_cycle.period_start, 'DD/MM/YYYY'),
        to_char(v_cycle.period_end,   'DD/MM/YYYY'),
        v_calc.valid_listen_count,
        round(v_calc.listen_share_percent::numeric, 4)
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

  RETURN jsonb_build_object(
    'cycle_id',          p_cycle_id,
    'distributed_count', v_distributed,
    'total_gnf',         v_total_gnf,
    'status',            'distributed'
  );
END;
$$;

COMMIT;
