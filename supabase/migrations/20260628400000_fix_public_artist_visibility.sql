-- Profil artiste public visible si créateur actif OU catalogue publié (évite 404 /listen/artist/[id])

BEGIN;

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
      AND (
        c.status = 'active'
        OR EXISTS (
          SELECT 1
          FROM public.tracks t
          WHERE t.creator_id = c.id
            AND t.publication_status = 'published'
            AND t.deleted_at IS NULL
        )
        OR EXISTS (
          SELECT 1
          FROM public.albums a
          WHERE a.creator_id = c.id
            AND a.publication_status = 'published'
            AND a.deleted_at IS NULL
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.creator_is_active_public(uuid) TO anon, authenticated, service_role;

COMMIT;
