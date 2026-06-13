-- ============================================================
-- C-5.1 — Aligner CHECK constraints bio avec FIELD_LIMITS.BIO = 300
-- Source: packages/shared/src/index.ts → BIO: 300, ARTIST_BIO: 300
--
-- VÉRIFICATION PRÉALABLE OBLIGATOIRE
-- Exécuter ces requêtes dans le SQL Editor AVANT la migration.
-- Si des lignes sont retournées, tronquer les données d'abord.
-- ============================================================
--
-- 1. Profiles avec bio dépassant 300 caractères :
--    SELECT id, full_name, char_length(bio) AS bio_length
--    FROM public.profiles
--    WHERE bio IS NOT NULL AND char_length(bio) > 300
--    ORDER BY bio_length DESC;
--
-- 2. Artist profiles avec bio dépassant 300 caractères :
--    SELECT ap.creator_id, ap.stage_name, char_length(ap.bio) AS bio_length
--    FROM public.artist_profiles ap
--    WHERE ap.bio IS NOT NULL AND char_length(ap.bio) > 300
--    ORDER BY bio_length DESC;
--
-- Si des résultats existent, tronquer AVANT migration :
--    UPDATE public.profiles
--    SET bio = left(bio, 300)
--    WHERE bio IS NOT NULL AND char_length(bio) > 300;
--
--    UPDATE public.artist_profiles
--    SET bio = left(bio, 300)
--    WHERE bio IS NOT NULL AND char_length(bio) > 300;
-- ============================================================

-- profiles.bio : 500 → 300
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_bio_length;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length
  CHECK (bio IS NULL OR char_length(bio) <= 300);

-- artist_profiles.bio : 1000 → 300
ALTER TABLE public.artist_profiles
  DROP CONSTRAINT IF EXISTS artist_profiles_bio_length;

ALTER TABLE public.artist_profiles
  ADD CONSTRAINT artist_profiles_bio_length
  CHECK (bio IS NULL OR char_length(bio) <= 300);
