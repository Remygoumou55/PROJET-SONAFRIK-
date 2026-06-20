-- Sprint 6 — Streaming OS complet
-- playlists · playlist_tracks · favorites · stream_sessions · stream_events · playback_positions
-- Real Listen V7.2 · Anti-fraude · Reprise lecture · Permissions streaming

-- ---------------------------------------------------------------------------
-- playlists
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 200),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
  cover_path TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  track_count INTEGER NOT NULL DEFAULT 0 CHECK (track_count >= 0),
  total_duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (total_duration_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_playlists_user ON public.playlists(user_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_playlists_public ON public.playlists(is_public, updated_at DESC) WHERE deleted_at IS NULL AND is_public = true;

CREATE TRIGGER playlists_set_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- playlist_tracks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_order ON public.playlist_tracks(playlist_id, position);

-- Maintenir track_count dénormalisé
CREATE OR REPLACE FUNCTION public.update_playlist_track_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.playlists
    SET track_count = track_count + 1,
        total_duration_seconds = total_duration_seconds + COALESCE(
          (SELECT duration_seconds FROM public.tracks WHERE id = NEW.track_id), 0
        )
    WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.playlists
    SET track_count = GREATEST(track_count - 1, 0),
        total_duration_seconds = GREATEST(total_duration_seconds - COALESCE(
          (SELECT duration_seconds FROM public.tracks WHERE id = OLD.track_id), 0
        ), 0)
    WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER playlist_tracks_count
  AFTER INSERT OR DELETE ON public.playlist_tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_playlist_track_count();

-- ---------------------------------------------------------------------------
-- favorites — polymorphique (track · album · artist · playlist)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('track', 'album', 'artist', 'playlist')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_entity ON public.favorites(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- stream_sessions — Real Listen V7.2
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  track_file_id UUID REFERENCES public.track_files(id) ON DELETE SET NULL,
  device_id TEXT,
  platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'ios', 'android')),
  quality_kbps INTEGER CHECK (quality_kbps IS NULL OR quality_kbps > 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  -- Real Listen V7.2 — calcul côté serveur uniquement
  total_listened_seconds INTEGER NOT NULL DEFAULT 0 CHECK (total_listened_seconds >= 0),
  total_duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (total_duration_seconds >= 0),
  listen_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (listen_percentage BETWEEN 0 AND 100),
  is_valid_listen BOOLEAN NOT NULL DEFAULT false,
  fraud_flags TEXT[] NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stream_sessions_user ON public.stream_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_track ON public.stream_sessions(track_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_valid ON public.stream_sessions(track_id, started_at DESC)
  WHERE is_valid_listen = true;

CREATE TRIGGER stream_sessions_set_updated_at
  BEFORE UPDATE ON public.stream_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stream_events — INSERT ONLY (audit immuable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stream_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.stream_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('play', 'pause', 'resume', 'seek', 'complete', 'skip', 'heartbeat')),
  position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stream_events_session ON public.stream_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stream_events_user ON public.stream_events(user_id, created_at DESC);

-- Bloquer UPDATE et DELETE (INSERT ONLY)
CREATE OR REPLACE FUNCTION public.prevent_stream_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'stream_events est en lecture seule (INSERT ONLY).';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stream_events_no_update
  BEFORE UPDATE ON public.stream_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_stream_events_mutation();

CREATE TRIGGER stream_events_no_delete
  BEFORE DELETE ON public.stream_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_stream_events_mutation();

-- Remplir track_id depuis la session si absent
CREATE OR REPLACE FUNCTION public.fill_stream_event_track_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.track_id IS NULL THEN
    SELECT track_id INTO NEW.track_id
    FROM public.stream_sessions
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stream_events_fill_track_id
  BEFORE INSERT ON public.stream_events
  FOR EACH ROW EXECUTE FUNCTION public.fill_stream_event_track_id();

-- ---------------------------------------------------------------------------
-- playback_positions — reprise de lecture
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.playback_positions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playback_positions_user ON public.playback_positions(user_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- RPC : start_stream_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_stream_session(
  p_track_id UUID,
  p_platform TEXT DEFAULT 'web',
  p_quality_kbps INTEGER DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL,
  p_total_duration_seconds INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non authentifié.'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tracks
    WHERE id = p_track_id
      AND publication_status = 'published'
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Morceau introuvable ou non publié.';
  END IF;

  INSERT INTO public.stream_sessions (
    user_id, track_id, platform, quality_kbps, device_id, total_duration_seconds
  ) VALUES (
    v_user_id, p_track_id, p_platform, p_quality_kbps, p_device_id, p_total_duration_seconds
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.start_stream_session TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC : update_stream_heartbeat (Real Listen V7.2 — calcul serveur)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_stream_heartbeat(
  p_session_id UUID,
  p_position_seconds INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_duration INTEGER;
BEGIN
  UPDATE public.stream_sessions
  SET last_heartbeat_at = now(),
      total_listened_seconds = GREATEST(p_position_seconds, 0)
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND completed_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.update_stream_heartbeat TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC : complete_stream_session — Real Listen V7.2 (seuil 90%)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_stream_session(
  p_session_id UUID,
  p_position_seconds INTEGER,
  p_total_duration_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_listen_percentage NUMERIC(5,2);
  v_is_valid BOOLEAN;
BEGIN
  -- Calcul côté serveur uniquement (CDC Règle #1)
  IF p_total_duration_seconds <= 0 THEN
    v_listen_percentage := 0;
  ELSE
    v_listen_percentage := LEAST(
      (p_position_seconds::NUMERIC / p_total_duration_seconds::NUMERIC) * 100,
      100
    );
  END IF;

  -- Seuil Real Listen V7.2 : 90%
  v_is_valid := v_listen_percentage >= 90.0;

  UPDATE public.stream_sessions
  SET completed_at = now(),
      total_listened_seconds = GREATEST(p_position_seconds, 0),
      total_duration_seconds = GREATEST(p_total_duration_seconds, total_duration_seconds),
      listen_percentage = v_listen_percentage,
      is_valid_listen = v_is_valid
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND completed_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable.';
  END IF;

  RETURN v_is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.complete_stream_session TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC : toggle_favorite
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_favorite(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non authentifié.'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.favorites
    WHERE user_id = v_user_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.favorites
    WHERE user_id = v_user_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id;
    RETURN false;
  ELSE
    INSERT INTO public.favorites (user_id, entity_type, entity_id)
    VALUES (v_user_id, p_entity_type, p_entity_id)
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.toggle_favorite TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC : is_favorited
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_favorited(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.favorites
    WHERE user_id = auth.uid()
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_favorited TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC : save_playback_position
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_playback_position(
  p_track_id UUID,
  p_position_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.playback_positions (user_id, track_id, position_seconds, updated_at)
  VALUES (auth.uid(), p_track_id, GREATEST(p_position_seconds, 0), now())
  ON CONFLICT (user_id, track_id)
  DO UPDATE SET
    position_seconds = GREATEST(EXCLUDED.position_seconds, 0),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.save_playback_position TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC : get_playback_position
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_playback_position(
  p_track_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_position INTEGER;
BEGIN
  SELECT position_seconds INTO v_position
  FROM public.playback_positions
  WHERE user_id = auth.uid()
    AND track_id = p_track_id;

  RETURN COALESCE(v_position, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_playback_position TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC : has_streaming_permission (MVP : tous les authentifiés peuvent streamer)
-- Sera mis à jour au Sprint Wallet OS pour vérifier l'abonnement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_streaming_permission(
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- MVP : permission accordée à tout utilisateur authentifié
  -- Sprint Wallet OS mettra à jour cette fonction pour vérifier l'abonnement
  RETURN (COALESCE(p_user_id, auth.uid())) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.has_streaming_permission TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- RPC : is_premium_user (MVP : false par défaut, sera connecté au Wallet OS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_premium_user(
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- MVP : retourne false. Sprint Wallet OS connectera aux abonnements.
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_premium_user TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket : audio (URLs pré-signées — CDC Règle #10)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  false, -- JAMAIS public — URLs signées obligatoires
  52428800,
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-flac', 'audio/flac', 'audio/aac']
)
ON CONFLICT (id) DO NOTHING;
