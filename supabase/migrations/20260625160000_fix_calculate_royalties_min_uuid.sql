-- Fix: PostgreSQL n'a pas MIN(uuid) — utiliser array_agg pour creator_id
BEGIN;

CREATE OR REPLACE FUNCTION public.calculate_royalties(p_cycle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle          public.royalty_cycles%ROWTYPE;
  v_total_listens  BIGINT  := 0;
  v_artist_count   INTEGER := 0;
  v_total_net      NUMERIC := 0;
BEGIN
  PERFORM public._assert_admin();

  SELECT * INTO v_cycle
  FROM public.royalty_cycles
  WHERE id = p_cycle_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle introuvable : %', p_cycle_id;
  END IF;

  IF v_cycle.status NOT IN ('open', 'calculating') THEN
    RAISE EXCEPTION 'Impossible de calculer un cycle en statut %. Statut requis : open ou calculating.',
      v_cycle.status;
  END IF;

  UPDATE public.royalty_cycles SET status = 'calculating' WHERE id = p_cycle_id;

  SELECT COUNT(*)::BIGINT INTO v_total_listens
  FROM public.stream_sessions ss
  JOIN public.tracks t ON ss.track_id = t.id
  WHERE ss.is_valid_listen = true
    AND ss.started_at::DATE BETWEEN v_cycle.period_start AND v_cycle.period_end
    AND t.deleted_at IS NULL;

  IF v_total_listens = 0 THEN
    UPDATE public.royalty_cycles
    SET status = 'ready', total_valid_listens = 0, artist_count = 0
    WHERE id = p_cycle_id;

    RETURN jsonb_build_object(
      'cycle_id',            p_cycle_id,
      'total_valid_listens', 0,
      'artist_count',        0,
      'revenue_pool_gnf',    v_cycle.revenue_pool_gnf,
      'total_net_gnf',       0,
      'status',              'ready'
    );
  END IF;

  WITH artist_listens AS (
    SELECT
      c.owner_id AS artist_id,
      (array_agg(c.id ORDER BY c.id))[1] AS creator_id,
      COUNT(ss.id) AS listen_count
    FROM public.stream_sessions ss
    JOIN public.tracks   t ON ss.track_id  = t.id
    JOIN public.creators c ON t.creator_id = c.id
    WHERE ss.is_valid_listen = true
      AND ss.started_at::DATE BETWEEN v_cycle.period_start AND v_cycle.period_end
      AND t.deleted_at IS NULL
    GROUP BY c.owner_id
  )
  INSERT INTO public.royalty_calculations (
    cycle_id, artist_id, creator_id,
    valid_listen_count,
    listen_share_percent,
    gross_amount_gnf,
    platform_commission_gnf,
    net_amount_gnf,
    status
  )
  SELECT
    p_cycle_id,
    al.artist_id,
    al.creator_id,
    al.listen_count,
    ROUND((al.listen_count::NUMERIC / v_total_listens * 100.0), 6),
    ROUND((al.listen_count::NUMERIC / v_total_listens * v_cycle.revenue_pool_gnf), 2),
    0,
    ROUND((al.listen_count::NUMERIC / v_total_listens * v_cycle.revenue_pool_gnf), 2),
    'pending'
  FROM artist_listens al
  ON CONFLICT (cycle_id, artist_id) DO UPDATE SET
    creator_id              = EXCLUDED.creator_id,
    valid_listen_count      = EXCLUDED.valid_listen_count,
    listen_share_percent    = EXCLUDED.listen_share_percent,
    gross_amount_gnf        = EXCLUDED.gross_amount_gnf,
    platform_commission_gnf = EXCLUDED.platform_commission_gnf,
    net_amount_gnf          = EXCLUDED.net_amount_gnf,
    status = CASE
      WHEN royalty_calculations.status = 'paid' THEN 'paid'
      ELSE 'pending'
    END,
    updated_at = now();

  SELECT COUNT(*), COALESCE(SUM(net_amount_gnf), 0)
  INTO v_artist_count, v_total_net
  FROM public.royalty_calculations
  WHERE cycle_id = p_cycle_id
    AND status   != 'cancelled';

  UPDATE public.royalty_cycles
  SET status              = 'ready',
      total_valid_listens = v_total_listens,
      artist_count        = v_artist_count
  WHERE id = p_cycle_id;

  RETURN jsonb_build_object(
    'cycle_id',            p_cycle_id,
    'total_valid_listens', v_total_listens,
    'artist_count',        v_artist_count,
    'revenue_pool_gnf',    v_cycle.revenue_pool_gnf,
    'total_net_gnf',       v_total_net,
    'status',              'ready'
  );
END;
$$;

COMMIT;
