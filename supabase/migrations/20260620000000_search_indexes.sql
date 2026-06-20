-- Migration : index trigramme pour la recherche multi-type
-- À exécuter manuellement dans Supabase SQL Editor par Mr Rémy
-- pg_trgm est disponible en standard sur toutes les instances Supabase

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Morceaux
CREATE INDEX IF NOT EXISTS idx_tracks_title_trgm
  ON public.tracks USING gin (title gin_trgm_ops)
  WHERE deleted_at IS NULL AND publication_status = 'published';

-- Artistes
CREATE INDEX IF NOT EXISTS idx_artist_profiles_stage_name_trgm
  ON public.artist_profiles USING gin (stage_name gin_trgm_ops);

-- Albums
CREATE INDEX IF NOT EXISTS idx_albums_title_trgm
  ON public.albums USING gin (title gin_trgm_ops)
  WHERE deleted_at IS NULL AND publication_status = 'published';

-- Playlists (publiques uniquement)
CREATE INDEX IF NOT EXISTS idx_playlists_title_trgm
  ON public.playlists USING gin (title gin_trgm_ops)
  WHERE deleted_at IS NULL AND is_public = true;

-- Beats : index cree dans 20260621000000_lot_a1_beats_store.sql (table beats creee apres)
