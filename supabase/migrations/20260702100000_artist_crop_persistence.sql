-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Artist Crop Persistence — Hero V3.5
-- Ajoute les colonnes de persistance du cadrage avatar + couverture principale
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS avatar_original_path    TEXT,
  ADD COLUMN IF NOT EXISTS avatar_crop_x           DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avatar_crop_y           DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avatar_crop_zoom        DOUBLE PRECISION DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cover_primary_original  TEXT,
  ADD COLUMN IF NOT EXISTS cover_primary_crop_x    DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_primary_crop_y    DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_primary_crop_zoom DOUBLE PRECISION DEFAULT 1;

COMMENT ON COLUMN artist_profiles.avatar_original_path    IS 'Path to uncropped original avatar — allows re-crop without re-upload';
COMMENT ON COLUMN artist_profiles.cover_primary_original  IS 'Path to uncropped original primary cover — allows re-crop without re-upload';

COMMIT;
