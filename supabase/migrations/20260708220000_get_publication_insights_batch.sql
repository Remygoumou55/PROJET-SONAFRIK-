-- Mes publications — insights batch (B3 perf)
-- Élimine le N+1 : 1 requête agrégée pour N tracks (streams valides + dernière activité)
-- Remplace N × (get_track_listen_counts + stream_sessions.select) côté repository.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_publication_insights_batch(p_track_ids UUID[])
RETURNS TABLE (
  track_id UUID,
  streams BIGINT,
  last_activity_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.track_id,
    COALESCE(agg.streams, 0)::BIGINT AS streams,
    agg.last_activity_at
  FROM unnest(p_track_ids) AS t(track_id)
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE s.is_valid_listen = true) AS streams,
      MAX(s.started_at) FILTER (WHERE s.is_valid_listen = true) AS last_activity_at
    FROM public.stream_sessions s
    WHERE s.track_id = t.track_id
  ) agg ON true;
$$;

REVOKE ALL ON FUNCTION public.get_publication_insights_batch(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_publication_insights_batch(UUID[]) TO authenticated;

COMMIT;
