-- War Plan A4 — synchroniser creators orphelins sans artist_profiles
BEGIN;

INSERT INTO public.artist_profiles (creator_id, stage_name, slug, updated_by)
SELECT
  c.id,
  COALESCE(NULLIF(TRIM(p.full_name), ''), NULLIF(TRIM(p.phone), ''), 'artiste-' || LEFT(c.id::text, 8)),
  lower(
    regexp_replace(
      COALESCE(NULLIF(TRIM(p.full_name), ''), 'artiste-' || LEFT(c.id::text, 8)),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    )
  ) || '-' || LEFT(c.id::text, 8),
  c.owner_id
FROM public.creators c
JOIN public.profiles p ON p.id = c.owner_id
LEFT JOIN public.artist_profiles ap ON ap.creator_id = c.id
WHERE c.deleted_at IS NULL
  AND ap.creator_id IS NULL
ON CONFLICT (creator_id) DO NOTHING;

COMMIT;
