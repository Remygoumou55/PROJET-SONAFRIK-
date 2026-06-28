-- Admin batch RPCs — autoriser service_role (BYPASS_AUTH / server-side admin reads)
-- Symptôme : P0001 "Accès non autorisé" car auth.uid() NULL avec service_role

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_batch_user_list_stats(p_user_ids UUID[])
RETURNS TABLE(
  user_id UUID,
  last_seen_at TIMESTAMPTZ,
  session_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    ls.last_seen_at,
    COALESCE(sc.session_count, 0)::bigint AS session_count
  FROM unnest(p_user_ids) AS u(id)
  LEFT JOIN LATERAL (
    SELECT MAX(us.last_active_at) AS last_seen_at
    FROM public.user_sessions us
    WHERE us.user_id = u.id
  ) ls ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS session_count
    FROM public.stream_sessions ss
    WHERE ss.user_id = u.id
  ) sc ON true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_batch_creator_catalog_stats(p_creator_ids UUID[])
RETURNS TABLE(
  creator_id UUID,
  tracks_count BIGINT,
  valid_streams BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  IF p_creator_ids IS NULL OR array_length(p_creator_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id AS creator_id,
    COALESCE(tc.tracks_count, 0)::bigint AS tracks_count,
    COALESCE(vs.valid_streams, 0)::bigint AS valid_streams
  FROM unnest(p_creator_ids) AS c(id)
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS tracks_count
    FROM public.tracks t
    WHERE t.creator_id = c.id
      AND t.deleted_at IS NULL
  ) tc ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(ss.id)::bigint AS valid_streams
    FROM public.stream_sessions ss
    INNER JOIN public.tracks t ON t.id = ss.track_id
    WHERE t.creator_id = c.id
      AND t.deleted_at IS NULL
      AND ss.is_valid_listen = true
  ) vs ON true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_batch_user_list_stats(UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_batch_creator_catalog_stats(UUID[]) TO service_role;

COMMIT;
