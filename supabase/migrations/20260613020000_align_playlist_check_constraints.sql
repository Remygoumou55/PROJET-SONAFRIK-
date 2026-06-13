-- ============================================================
-- C-5.4 — Aligner CHECK constraints playlists avec FIELD_LIMITS
-- Source: packages/shared/src/index.ts
--   PLAYLIST_TITLE: 60
--   PLAYLIST_DESCRIPTION: 200
--
-- Contraintes inline actuelles (auto-nommées par PostgreSQL) :
--   playlists_title_check       : BETWEEN 2 AND 200 → BETWEEN 2 AND 60
--   playlists_description_check : <= 1000            → <= 200
--
-- VÉRIFICATION DES NOMS RÉELS EN BASE (exécuter d'abord) :
--   SELECT conname, pg_get_constraintdef(oid) AS definition
--   FROM pg_constraint
--   WHERE conrelid = 'public.playlists'::regclass AND contype = 'c'
--   ORDER BY conname;
--
-- Si les noms retournés diffèrent de playlists_title_check /
-- playlists_description_check, adapter les DROP ci-dessous.
--
-- VÉRIFICATION PRÉALABLE DES DONNÉES :
--
-- Titres dépassant 60 caractères :
--   SELECT id, title, char_length(title) AS title_length
--   FROM public.playlists
--   WHERE char_length(trim(title)) > 60 AND deleted_at IS NULL
--   ORDER BY title_length DESC;
--
-- Descriptions dépassant 200 caractères :
--   SELECT id, title, char_length(description) AS desc_length
--   FROM public.playlists
--   WHERE description IS NOT NULL AND char_length(description) > 200
--     AND deleted_at IS NULL
--   ORDER BY desc_length DESC;
--
-- Tronquer si nécessaire AVANT migration :
--   UPDATE public.playlists
--   SET title = left(trim(title), 60)
--   WHERE char_length(trim(title)) > 60;
--
--   UPDATE public.playlists
--   SET description = left(description, 200)
--   WHERE description IS NOT NULL AND char_length(description) > 200;
-- ============================================================

-- playlists.title : BETWEEN 2 AND 200 → BETWEEN 2 AND 60 (PLAYLIST_TITLE)
ALTER TABLE public.playlists
  DROP CONSTRAINT IF EXISTS playlists_title_check;

ALTER TABLE public.playlists
  ADD CONSTRAINT playlists_title_check
  CHECK (char_length(trim(title)) BETWEEN 2 AND 60);

-- playlists.description : <= 1000 → <= 200 (PLAYLIST_DESCRIPTION)
ALTER TABLE public.playlists
  DROP CONSTRAINT IF EXISTS playlists_description_check;

ALTER TABLE public.playlists
  ADD CONSTRAINT playlists_description_check
  CHECK (description IS NULL OR char_length(description) <= 200);
