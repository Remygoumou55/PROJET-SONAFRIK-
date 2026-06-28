-- Phase C : permissions streaming, invalidation fraude, royalties via artist_profiles

BEGIN;

-- ── 1. start_stream_session — vérifier has_streaming_permission ─────────────
CREATE OR REPLACE FUNCTION public.start_stream_session(
  p_track_id UUID,
  p_platform TEXT DEFAULT 'web',
  p_quality_kbps INTEGER DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL,
  p_total_duration_seconds INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

  IF NOT public.has_streaming_permission(v_user_id) THEN
    RAISE EXCEPTION 'no_streaming_permission';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tracks
    WHERE id = p_track_id
      AND publication_status = 'published'
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Morceau introuvable ou non publié.';
  END IF;

  UPDATE public.stream_sessions
  SET completed_at = now(),
      is_valid_listen = false,
      fraud_flags = array_append(
        COALESCE(fraud_flags, '{}'),
        CASE
          WHEN last_heartbeat_at < now() - INTERVAL '5 minutes' THEN 'orphaned_session'
          ELSE 'multi_session_start'
        END
      )
  WHERE user_id = v_user_id
    AND completed_at IS NULL;

  INSERT INTO public.stream_sessions (
    user_id, track_id, platform, quality_kbps, device_id, total_duration_seconds
  ) VALUES (
    v_user_id, p_track_id, p_platform, p_quality_kbps, p_device_id, p_total_duration_seconds
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.start_stream_session TO authenticated;

-- ── 2. complete_stream_session — invalider si fraud_flags non vides ─────────
CREATE OR REPLACE FUNCTION public.complete_stream_session(
  p_session_id UUID,
  p_position_seconds INTEGER,
  p_total_duration_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_listen_percentage NUMERIC(5,2);
  v_is_valid BOOLEAN;
  v_existing RECORD;
  v_effective_position INTEGER;
  v_fraud_flags TEXT[];
BEGIN
  SELECT is_valid_listen, completed_at, total_listened_seconds, fraud_flags
  INTO v_existing
  FROM public.stream_sessions
  WHERE id = p_session_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable.';
  END IF;

  IF v_existing.completed_at IS NOT NULL THEN
    RETURN COALESCE(v_existing.is_valid_listen, false);
  END IF;

  v_fraud_flags := COALESCE(v_existing.fraud_flags, '{}');

  v_effective_position := GREATEST(
    GREATEST(p_position_seconds, 0),
    COALESCE(v_existing.total_listened_seconds, 0)
  );

  IF p_total_duration_seconds <= 0 THEN
    v_listen_percentage := 0;
  ELSE
    v_listen_percentage := LEAST(
      (v_effective_position::NUMERIC / p_total_duration_seconds::NUMERIC) * 100,
      100
    );
  END IF;

  v_is_valid := v_listen_percentage >= 90.0;

  IF v_fraud_flags != '{}' THEN
    v_is_valid := false;
  END IF;

  UPDATE public.stream_sessions
  SET completed_at = now(),
      total_listened_seconds = v_effective_position,
      total_duration_seconds = GREATEST(p_total_duration_seconds, total_duration_seconds),
      listen_percentage = v_listen_percentage,
      is_valid_listen = v_is_valid
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND completed_at IS NULL;

  IF NOT FOUND THEN
    SELECT is_valid_listen INTO v_is_valid
    FROM public.stream_sessions
    WHERE id = p_session_id
      AND user_id = auth.uid()
      AND completed_at IS NOT NULL;
    RETURN COALESCE(v_is_valid, false);
  END IF;

  RETURN v_is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.complete_stream_session TO authenticated;

-- ── 3. get_track_listen_counts — exclure sessions frauduleuses ──────────────
CREATE OR REPLACE FUNCTION public.get_track_listen_counts(p_track_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_all_time INTEGER;
  v_7d INTEGER;
  v_30d INTEGER;
  v_unique INTEGER;
BEGIN
  IF p_track_id IS NULL THEN
    RETURN jsonb_build_object(
      'track_id', NULL,
      'all_time', 0,
      'window_7d', 0,
      'window_30d', 0,
      'unique_listeners_all_time', 0
    );
  END IF;

  SELECT
    COUNT(*) FILTER (
      WHERE is_valid_listen = true AND COALESCE(fraud_flags, '{}') = '{}'
    ),
    COUNT(*) FILTER (
      WHERE is_valid_listen = true
        AND COALESCE(fraud_flags, '{}') = '{}'
        AND started_at >= now() - INTERVAL '7 days'
    ),
    COUNT(*) FILTER (
      WHERE is_valid_listen = true
        AND COALESCE(fraud_flags, '{}') = '{}'
        AND started_at >= now() - INTERVAL '30 days'
    ),
    COUNT(DISTINCT user_id) FILTER (
      WHERE is_valid_listen = true AND COALESCE(fraud_flags, '{}') = '{}'
    )
  INTO v_all_time, v_7d, v_30d, v_unique
  FROM public.stream_sessions
  WHERE track_id = p_track_id;

  RETURN jsonb_build_object(
    'track_id', p_track_id,
    'all_time', COALESCE(v_all_time, 0),
    'window_7d', COALESCE(v_7d, 0),
    'window_30d', COALESCE(v_30d, 0),
    'unique_listeners_all_time', COALESCE(v_unique, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_track_listen_counts(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_track_listen_counts(UUID) TO authenticated, anon;

-- ── 4. calculate_royalties — artist_profiles + exclusion fraude ─────────────
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
    AND COALESCE(ss.fraud_flags, '{}') = '{}'
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
    JOIN public.tracks t ON ss.track_id = t.id
    JOIN public.creators c ON t.creator_id = c.id AND c.deleted_at IS NULL
    JOIN public.artist_profiles ap ON ap.creator_id = c.id
    WHERE ss.is_valid_listen = true
      AND COALESCE(ss.fraud_flags, '{}') = '{}'
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

-- ── 5. Backfill : écoutes marquées valides malgré fraud_flags ───────────────
UPDATE public.stream_sessions
SET is_valid_listen = false
WHERE is_valid_listen = true
  AND COALESCE(fraud_flags, '{}') != '{}';

COMMIT;
