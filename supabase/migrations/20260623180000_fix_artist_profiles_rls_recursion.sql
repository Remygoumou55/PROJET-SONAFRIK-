-- Phase 2 audit — corrige la récursion infinie RLS entre creators et artist_profiles.
-- Symptôme : search artists → "infinite recursion detected in policy for relation artist_profiles"

CREATE OR REPLACE FUNCTION public.creator_is_active_public(p_creator_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.id = p_creator_id
      AND c.deleted_at IS NULL
      AND c.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_public_artist_profile(p_creator_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.artist_profiles ap
    WHERE ap.creator_id = p_creator_id
      AND ap.is_public = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.creator_is_active_public(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_public_artist_profile(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS creators_select_public_active ON public.creators;
CREATE POLICY creators_select_public_active ON public.creators
  FOR SELECT TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND status = 'active'
    AND public.has_public_artist_profile(id)
  );

DROP POLICY IF EXISTS artist_profiles_select_public ON public.artist_profiles;
CREATE POLICY artist_profiles_select_public ON public.artist_profiles
  FOR SELECT TO anon, authenticated
  USING (
    is_public = true
    AND public.creator_is_active_public(creator_id)
  );
