-- Corrections audit backend : trending + analytics excluent fraude ; fenêtre all-time

BEGIN;

CREATE OR REPLACE FUNCTION public.get_trending_tracks(
  p_window TEXT    DEFAULT '7d',
  p_limit  INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since  TIMESTAMPTZ;
  v_lim    INTEGER;
  v_result JSONB;
BEGIN
  v_lim := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_since := CASE p_window
    WHEN 'today' THEN date_trunc('day', now())
    WHEN '7d'    THEN now() - INTERVAL '7 days'
    WHEN '30d'   THEN now() - INTERVAL '30 days'
    WHEN 'all'   THEN NULL
    ELSE now() - INTERVAL '7 days'
  END;

  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'track_id',         t.id,
      'title',            t.title,
      'slug',             t.slug,
      'duration_seconds', t.duration_seconds,
      'artist_name',      ap.stage_name,
      'creator_id',       t.creator_id,
      'album_id',         t.album_id,
      'album_title',      al.title,
      'cover_path',       al.cover_path,
      'listen_count',     COUNT(ss.id),
      'unique_listeners', COUNT(DISTINCT ss.user_id),
      'trending_score',   ROUND(
        COUNT(ss.id)::numeric
        * (1 + COUNT(DISTINCT ss.user_id)::numeric
               / GREATEST(COUNT(ss.id)::numeric, 1)),
        4)
    ) AS row_data,
    COUNT(ss.id) AS sort_count
    FROM public.stream_sessions ss
    JOIN public.tracks t
      ON t.id = ss.track_id
      AND t.deleted_at IS NULL
      AND t.publication_status = 'published'
    LEFT JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
    LEFT JOIN public.albums al
      ON al.id = t.album_id
      AND al.deleted_at IS NULL
    WHERE ss.is_valid_listen = true
      AND COALESCE(ss.fraud_flags, '{}') = '{}'
      AND (v_since IS NULL OR ss.started_at >= v_since)
    GROUP BY t.id, t.title, t.slug, t.duration_seconds, t.creator_id, t.album_id,
             ap.stage_name, al.title, al.cover_path
    ORDER BY sort_count DESC, COUNT(DISTINCT ss.user_id) DESC
    LIMIT v_lim
  ) subq;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_creator_stream_analytics(
  p_creator_id UUID,
  p_period_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since TIMESTAMPTZ := now() - make_interval(days => GREATEST(1, LEAST(p_period_days, 90)));
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF NOT public.is_admin(auth.uid())
     AND NOT EXISTS (
       SELECT 1 FROM public.creators c
       WHERE c.id = p_creator_id
         AND c.owner_id = auth.uid()
         AND c.deleted_at IS NULL
     ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'creator_id', p_creator_id,
    'period_days', p_period_days,
    'total_streams', COUNT(*)::int,
    'valid_streams', COUNT(*)::int,
    'unique_listeners', COUNT(DISTINCT ss.user_id)::int,
    'total_listened_seconds', COALESCE(SUM(ss.total_listened_seconds), 0)::bigint,
    'top_tracks', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'track_id', agg.track_id,
          'title', agg.title,
          'stream_count', agg.stream_count
        )
        ORDER BY agg.stream_count DESC
      )
      FROM (
        SELECT tr.id AS track_id, tr.title, COUNT(*)::int AS stream_count
        FROM public.stream_sessions ss2
        JOIN public.tracks tr ON tr.id = ss2.track_id
        WHERE tr.creator_id = p_creator_id
          AND tr.deleted_at IS NULL
          AND ss2.is_valid_listen = true
          AND COALESCE(ss2.fraud_flags, '{}') = '{}'
          AND ss2.started_at >= v_since
        GROUP BY tr.id, tr.title
        ORDER BY stream_count DESC
        LIMIT 10
      ) agg
    ), '[]'::jsonb),
    'streams_by_platform', jsonb_build_object(
      'web', COUNT(*) FILTER (WHERE ss.platform = 'web'),
      'ios', COUNT(*) FILTER (WHERE ss.platform = 'ios'),
      'android', COUNT(*) FILTER (WHERE ss.platform = 'android')
    )
  )
  INTO v_result
  FROM public.stream_sessions ss
  JOIN public.tracks tr ON tr.id = ss.track_id
  WHERE tr.creator_id = p_creator_id
    AND tr.deleted_at IS NULL
    AND ss.is_valid_listen = true
    AND COALESCE(ss.fraud_flags, '{}') = '{}'
    AND ss.started_at >= v_since;

  RETURN COALESCE(v_result, jsonb_build_object(
    'creator_id', p_creator_id,
    'period_days', p_period_days,
    'total_streams', 0,
    'valid_streams', 0,
    'unique_listeners', 0,
    'total_listened_seconds', 0,
    'top_tracks', '[]'::jsonb,
    'streams_by_platform', jsonb_build_object('web', 0, 'ios', 0, 'android', 0)
  ));
END;
$$;

COMMIT;
