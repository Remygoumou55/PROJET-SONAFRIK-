-- Migration: add play_count, is_pinned, pin_order to tracks
-- Scope: tracks table (existing RLS policies apply)
-- Max 3 pinned tracks per creator enforced by trigger

BEGIN;

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS play_count   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pin_order    INTEGER NOT NULL DEFAULT 0;

-- Ensure play_count never goes negative
ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_play_count_non_negative CHECK (play_count >= 0);

-- Index for fast pinned lookups per creator
CREATE INDEX IF NOT EXISTS idx_tracks_pinned_by_creator
  ON public.tracks (creator_id, pin_order)
  WHERE is_pinned = TRUE AND deleted_at IS NULL AND publication_status = 'published';

-- Index for sorting by play_count
CREATE INDEX IF NOT EXISTS idx_tracks_play_count_by_creator
  ON public.tracks (creator_id, play_count DESC)
  WHERE deleted_at IS NULL AND publication_status = 'published';

-- Trigger: enforce max 3 pinned tracks per creator
CREATE OR REPLACE FUNCTION public.enforce_max_pinned_tracks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_pinned = TRUE THEN
    IF (
      SELECT COUNT(*)
      FROM public.tracks
      WHERE creator_id = NEW.creator_id
        AND is_pinned = TRUE
        AND deleted_at IS NULL
        AND id != NEW.id
    ) >= 3 THEN
      RAISE EXCEPTION 'Un artiste ne peut épingler que 3 morceaux maximum.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_max_pinned_tracks ON public.tracks;
CREATE TRIGGER trg_max_pinned_tracks
  BEFORE INSERT OR UPDATE OF is_pinned
  ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_max_pinned_tracks();

COMMIT;
