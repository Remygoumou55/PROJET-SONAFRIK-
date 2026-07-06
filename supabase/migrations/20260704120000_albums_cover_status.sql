-- Cover Engine v1.1 — Business state: cover_status on albums
-- Complements metadata.cover_source (technical origin).

BEGIN;

ALTER TABLE public.albums
  ADD COLUMN IF NOT EXISTS cover_status TEXT NOT NULL DEFAULT 'AUTO_GENERATED';

ALTER TABLE public.albums
  DROP CONSTRAINT IF EXISTS albums_cover_status_check;

ALTER TABLE public.albums
  ADD CONSTRAINT albums_cover_status_check
  CHECK (cover_status IN ('AUTO_GENERATED', 'USER_REPLACED'));

COMMENT ON COLUMN public.albums.cover_status IS
  'Cover Engine business state: AUTO_GENERATED | USER_REPLACED';

-- Backfill: user-origin covers → USER_REPLACED; auto or legacy unknown stays AUTO_GENERATED
UPDATE public.albums
SET cover_status = 'USER_REPLACED'
WHERE deleted_at IS NULL
  AND (
    metadata->>'cover_source' = 'user'
    OR (
      cover_path IS NOT NULL
      AND length(trim(cover_path)) > 0
      AND COALESCE(metadata->>'cover_source', '') <> 'auto'
    )
  );

COMMIT;
