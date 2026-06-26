-- War Plan D3 — agrégation analytics créateur côté SQL (évite scan 10k rows client)
BEGIN;

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

GRANT EXECUTE ON FUNCTION public.get_creator_stream_analytics(UUID, INT) TO authenticated;

COMMIT;
