-- RPC publique profil artiste — pages /listen/artist/[id] sans dépendre de la session

BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_artist_profile(p_creator_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'creator_id', ap.creator_id,
    'stage_name', ap.stage_name,
    'bio', ap.bio,
    'genres', COALESCE(to_jsonb(ap.genres), '[]'::jsonb),
    'cover_path', ap.cover_path,
    'banner_path', ap.banner_path,
    'verified', ap.verified
  )
  FROM public.artist_profiles ap
  WHERE ap.creator_id = p_creator_id
    AND ap.is_public = true
    AND public.creator_is_active_public(p_creator_id)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_artist_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_artist_profile(uuid) TO anon, authenticated, service_role;

COMMIT;
