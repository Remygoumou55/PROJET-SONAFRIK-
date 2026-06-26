-- Artist Dashboard Hero — médias profil & galerie couverture
-- ---------------------------------------------------------------------------
-- profile_photo : photo de profil artiste (sync cover_path pour rétrocompat)
-- cover_images  : galerie couverture (ordre = slider) ; cover_order implicite
-- cover_updated_at : horodatage dernière modification galerie
-- ---------------------------------------------------------------------------

BEGIN;

ALTER TABLE public.artist_profiles
  ADD COLUMN IF NOT EXISTS profile_photo TEXT,
  ADD COLUMN IF NOT EXISTS cover_images TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cover_updated_at TIMESTAMPTZ;

-- Rétrocompat : backfill depuis colonnes existantes
UPDATE public.artist_profiles
SET profile_photo = cover_path
WHERE profile_photo IS NULL AND cover_path IS NOT NULL;

UPDATE public.artist_profiles
SET
  cover_images = ARRAY[banner_path],
  cover_updated_at = COALESCE(cover_updated_at, updated_at, created_at)
WHERE banner_path IS NOT NULL
  AND (cover_images IS NULL OR cover_images = '{}');

COMMIT;
