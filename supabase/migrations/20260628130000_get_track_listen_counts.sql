-- Phase B : compteur d'écoutes valides par track (all-time + fenêtres)

BEGIN;

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
    COUNT(*) FILTER (WHERE is_valid_listen = true),
    COUNT(*) FILTER (
      WHERE is_valid_listen = true AND started_at >= now() - INTERVAL '7 days'
    ),
    COUNT(*) FILTER (
      WHERE is_valid_listen = true AND started_at >= now() - INTERVAL '30 days'
    ),
    COUNT(DISTINCT user_id) FILTER (WHERE is_valid_listen = true)
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

COMMIT;
