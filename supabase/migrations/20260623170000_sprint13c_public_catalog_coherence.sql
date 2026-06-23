-- Sprint 1.3-C — Grants service_role + cohérence catalog public (pages artiste/album)

GRANT SELECT, INSERT, UPDATE ON public.creators TO service_role;

-- Créateurs manquants pour profils artiste existants (données S12B)
INSERT INTO public.creators (id, owner_id, status)
SELECT
  ap.creator_id,
  COALESCE(
    (SELECT t.created_by FROM public.tracks t WHERE t.creator_id = ap.creator_id LIMIT 1),
    ap.updated_by
  ),
  'active'
FROM public.artist_profiles ap
WHERE NOT EXISTS (SELECT 1 FROM public.creators c WHERE c.id = ap.creator_id)
ON CONFLICT (id) DO NOTHING;

-- Activer les créateurs avec morceaux publiés
UPDATE public.creators c
SET status = 'active'
WHERE status IS DISTINCT FROM 'active'
  AND EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.creator_id = c.id
      AND t.publication_status = 'published'
      AND t.deleted_at IS NULL
  );
