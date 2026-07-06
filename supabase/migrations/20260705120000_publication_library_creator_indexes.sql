-- Mes publications — indexes liste créateur (tri + filtre statut)
-- Couvre : creator_id + publication_status + updated_at (tri défaut)
--          creator_id + title (tri A→Z)

BEGIN;

CREATE INDEX IF NOT EXISTS idx_tracks_creator_library
  ON public.tracks (creator_id, publication_status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tracks_creator_library_title
  ON public.tracks (creator_id, title ASC)
  WHERE deleted_at IS NULL;

COMMIT;
