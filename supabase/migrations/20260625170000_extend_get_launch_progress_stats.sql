-- P1 /lancement — agrégats publics artistes + morceaux publiés dans get_launch_progress

BEGIN;

CREATE OR REPLACE FUNCTION public.get_launch_progress()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'current', (
      SELECT COUNT(*)
        FROM public.profiles
       WHERE is_premium = true
         AND premium_expires_at > now()
         AND deleted_at IS NULL
    ),
    'target', (
      SELECT COALESCE((value::text)::bigint, 2000)
        FROM public.system_settings
       WHERE key = 'launch_subscriber_target'
    ),
    'artist_count', (
      SELECT COUNT(DISTINCT t.creator_id)
        FROM public.tracks t
        INNER JOIN public.artist_profiles ap
          ON ap.creator_id = t.creator_id
         AND ap.is_public = true
       WHERE t.publication_status = 'published'
         AND t.deleted_at IS NULL
    ),
    'track_count', (
      SELECT COUNT(*)
        FROM public.tracks t
       WHERE t.publication_status = 'published'
         AND t.deleted_at IS NULL
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_launch_progress() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_launch_progress() TO anon, authenticated;

COMMENT ON FUNCTION public.get_launch_progress() IS
  'Progression lancement : abonnés premium actifs, objectif, artistes et morceaux publiés (agrégats anonymisés).';

COMMIT;
