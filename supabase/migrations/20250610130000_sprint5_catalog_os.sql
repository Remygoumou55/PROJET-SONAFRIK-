-- Sprint 5 — Catalog OS complet
-- Genres · Albums · Singles · Tracks · Metadata · ISRC · UPC · Assets

-- ---------------------------------------------------------------------------
-- genres
-- ---------------------------------------------------------------------------
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_genres_active ON public.genres(sort_order) WHERE deleted_at IS NULL AND is_active = true;

CREATE TRIGGER genres_set_updated_at
  BEFORE UPDATE ON public.genres
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.genres (name, slug, description, sort_order) VALUES
  ('Afrobeat', 'afrobeat', 'Rythmes afro contemporains', 1),
  ('Mandingue', 'mandingue', 'Traditions Manding', 2),
  ('Rap GN', 'rap-gn', 'Hip-hop guinéen', 3),
  ('Gospel', 'gospel', 'Musique gospel africaine', 4),
  ('Reggae', 'reggae', 'Reggae & dancehall', 5),
  ('Pop Africaine', 'pop-africaine', 'Pop continentale', 6),
  ('Traditionnel', 'traditionnel', 'Musiques traditionnelles', 7)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- albums (album · single · ep)
-- ---------------------------------------------------------------------------
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  label_id UUID REFERENCES public.labels(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  release_type TEXT NOT NULL DEFAULT 'album' CHECK (release_type IN ('album', 'single', 'ep')),
  upc TEXT,
  description TEXT,
  cover_path TEXT,
  release_date DATE,
  publication_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft', 'pending_review', 'published', 'rejected', 'archived')),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  UNIQUE (creator_id, slug)
);

ALTER TABLE public.albums
  ADD CONSTRAINT albums_upc_format CHECK (upc IS NULL OR upc ~ '^\d{12,14}$');

CREATE INDEX idx_albums_creator ON public.albums(creator_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_albums_status ON public.albums(publication_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_albums_published ON public.albums(release_date DESC)
  WHERE deleted_at IS NULL AND publication_status = 'published';

CREATE TRIGGER albums_set_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- album_genres
-- ---------------------------------------------------------------------------
CREATE TABLE public.album_genres (
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (album_id, genre_id)
);

-- ---------------------------------------------------------------------------
-- tracks
-- ---------------------------------------------------------------------------
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  track_number INTEGER NOT NULL DEFAULT 1 CHECK (track_number >= 1),
  isrc TEXT,
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  explicit BOOLEAN NOT NULL DEFAULT false,
  language TEXT NOT NULL DEFAULT 'fr',
  bpm INTEGER CHECK (bpm IS NULL OR (bpm >= 40 AND bpm <= 240)),
  musical_key TEXT,
  publication_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft', 'pending_review', 'published', 'rejected', 'archived')),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  UNIQUE (creator_id, slug)
);

ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_isrc_format CHECK (isrc IS NULL OR isrc ~ '^[A-Z]{2}[A-Z0-9]{3}\d{7}$');

CREATE INDEX idx_tracks_album ON public.tracks(album_id, track_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_tracks_creator ON public.tracks(creator_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_tracks_isrc ON public.tracks(isrc) WHERE isrc IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER tracks_set_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- track_genres
-- ---------------------------------------------------------------------------
CREATE TABLE public.track_genres (
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (track_id, genre_id)
);

-- ---------------------------------------------------------------------------
-- track_files — assets audio (URLs signées uniquement)
-- ---------------------------------------------------------------------------
CREATE TABLE public.track_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('mp3', 'aac', 'flac', 'wav')),
  bitrate_kbps INTEGER CHECK (bitrate_kbps IS NULL OR bitrate_kbps > 0),
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_track_files_track ON public.track_files(track_id);
CREATE UNIQUE INDEX idx_track_files_primary ON public.track_files(track_id) WHERE is_primary = true;

CREATE TRIGGER track_files_set_updated_at
  BEFORE UPDATE ON public.track_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RPC workflow publication
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_album_for_review(p_album_id UUID)
RETURNS VOID AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  SELECT creator_id INTO v_creator_id FROM public.albums WHERE id = p_album_id AND deleted_at IS NULL;
  IF v_creator_id IS NULL THEN RAISE EXCEPTION 'Album introuvable.'; END IF;
  IF NOT public.can_edit_creator(v_creator_id) THEN RAISE EXCEPTION 'Accès non autorisé.'; END IF;

  UPDATE public.albums
  SET publication_status = 'pending_review', submitted_at = now(), updated_by = auth.uid()
  WHERE id = p_album_id AND publication_status IN ('draft', 'rejected');

  IF NOT FOUND THEN RAISE EXCEPTION 'Impossible de soumettre cet album.'; END IF;

  PERFORM public.log_audit_event_authenticated('catalog.album.submitted', 'albums', p_album_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.submit_album_for_review TO authenticated;

CREATE OR REPLACE FUNCTION public.review_album_publication(
  p_album_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Accès administrateur requis.'; END IF;
  IF p_status NOT IN ('published', 'rejected') THEN RAISE EXCEPTION 'Statut invalide.'; END IF;

  UPDATE public.albums
  SET publication_status = p_status,
      rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      published_at = CASE WHEN p_status = 'published' THEN now() ELSE published_at END,
      updated_by = auth.uid()
  WHERE id = p_album_id AND publication_status = 'pending_review';

  IF NOT FOUND THEN RAISE EXCEPTION 'Album non éligible à la revue.'; END IF;

  IF p_status = 'published' THEN
    UPDATE public.tracks
    SET publication_status = 'published', published_at = now(), updated_by = auth.uid()
    WHERE album_id = p_album_id AND publication_status IN ('draft', 'pending_review', 'published');
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'catalog.album.reviewed', 'albums', p_album_id, jsonb_build_object('status', p_status)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.review_album_publication TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_track_for_review(p_track_id UUID)
RETURNS VOID AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  SELECT creator_id INTO v_creator_id FROM public.tracks WHERE id = p_track_id AND deleted_at IS NULL;
  IF v_creator_id IS NULL THEN RAISE EXCEPTION 'Morceau introuvable.'; END IF;
  IF NOT public.can_edit_creator(v_creator_id) THEN RAISE EXCEPTION 'Accès non autorisé.'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.track_files tf WHERE tf.track_id = p_track_id AND tf.is_primary = true
  ) THEN
    RAISE EXCEPTION 'Fichier audio principal requis avant soumission.';
  END IF;

  UPDATE public.tracks
  SET publication_status = 'pending_review', submitted_at = now(), updated_by = auth.uid()
  WHERE id = p_track_id AND publication_status IN ('draft', 'rejected');

  IF NOT FOUND THEN RAISE EXCEPTION 'Impossible de soumettre ce morceau.'; END IF;

  PERFORM public.log_audit_event_authenticated('catalog.track.submitted', 'tracks', p_track_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.submit_track_for_review TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage catalog (audio + visuels privés)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalog-audio',
  'catalog-audio',
  false,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-flac', 'audio/flac']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalog-visuals',
  'catalog-visuals',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
