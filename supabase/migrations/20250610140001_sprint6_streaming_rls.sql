-- Sprint 6 — RLS Streaming OS
-- playlists · playlist_tracks · favorites · stream_sessions · stream_events · playback_positions
-- Storage audio · Permissions streaming

-- ---------------------------------------------------------------------------
-- Activer RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playback_positions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- playlists
-- ---------------------------------------------------------------------------

-- Lecture : playlists publiques + propres playlists
CREATE POLICY IF NOT EXISTS playlists_select ON public.playlists
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (user_id = auth.uid() OR is_public = true OR public.is_admin(auth.uid()))
  );

-- Création : pour soi-même uniquement
CREATE POLICY IF NOT EXISTS playlists_insert ON public.playlists
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Modification : propriétaire ou admin
CREATE POLICY IF NOT EXISTS playlists_update ON public.playlists
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Soft delete : propriétaire ou admin
CREATE POLICY IF NOT EXISTS playlists_delete ON public.playlists
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- playlist_tracks
-- ---------------------------------------------------------------------------

-- Lecture : playlists accessibles
CREATE POLICY IF NOT EXISTS playlist_tracks_select ON public.playlist_tracks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id
        AND p.deleted_at IS NULL
        AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

-- Ajout : propriétaire de la playlist uniquement
CREATE POLICY IF NOT EXISTS playlist_tracks_insert ON public.playlist_tracks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id
        AND p.user_id = auth.uid()
        AND p.deleted_at IS NULL
    )
  );

-- Réordonnancement : propriétaire uniquement
CREATE POLICY IF NOT EXISTS playlist_tracks_update ON public.playlist_tracks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND p.user_id = auth.uid()
    )
  );

-- Suppression : propriétaire uniquement
CREATE POLICY IF NOT EXISTS playlist_tracks_delete ON public.playlist_tracks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------

-- Lecture : ses propres favoris uniquement
CREATE POLICY IF NOT EXISTS favorites_select ON public.favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Les RPCs toggle_favorite / is_favorited utilisent SECURITY DEFINER
-- Pour l'accès direct :
CREATE POLICY IF NOT EXISTS favorites_insert ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS favorites_delete ON public.favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- stream_sessions — accès via RPCs SECURITY DEFINER uniquement
-- ---------------------------------------------------------------------------

-- Lecture : ses propres sessions uniquement
CREATE POLICY IF NOT EXISTS stream_sessions_select ON public.stream_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Insertion : via RPC start_stream_session (SECURITY DEFINER)
-- Politique permissive pour les RPCs
CREATE POLICY IF NOT EXISTS stream_sessions_insert ON public.stream_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Mise à jour : via RPCs heartbeat/complete (SECURITY DEFINER)
CREATE POLICY IF NOT EXISTS stream_sessions_update ON public.stream_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- stream_events — INSERT ONLY, accès lecture restreint
-- ---------------------------------------------------------------------------

-- Lecture : ses propres événements
CREATE POLICY IF NOT EXISTS stream_events_select ON public.stream_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Insertion uniquement
CREATE POLICY IF NOT EXISTS stream_events_insert ON public.stream_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE et DELETE bloqués par trigger (prevent_stream_events_mutation)

-- ---------------------------------------------------------------------------
-- playback_positions
-- ---------------------------------------------------------------------------

-- Lecture : ses propres positions
CREATE POLICY IF NOT EXISTS playback_positions_select ON public.playback_positions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Gestion via RPC save_playback_position (SECURITY DEFINER)
CREATE POLICY IF NOT EXISTS playback_positions_insert ON public.playback_positions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS playback_positions_update ON public.playback_positions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage : audio — URLs pré-signées uniquement (CDC Règle #10)
-- Les fichiers sont organisés : {creator_id}/tracks/{track_id}/{filename}
-- Accès direct interdit — seules les Edge Functions peuvent générer les URLs
-- ---------------------------------------------------------------------------

-- Lecture : BLOQUÉE côté RLS — les Edge Functions utilisent service_role
-- Pas de politique SELECT pour 'audio' depuis les clients normaux

-- Insertion : créateurs vérifient le chemin
CREATE POLICY IF NOT EXISTS audio_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audio'
    AND public.can_edit_creator(((storage.foldername(name))[1])::uuid)
  );

-- Mise à jour : créateurs uniquement
CREATE POLICY IF NOT EXISTS audio_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'audio'
    AND public.can_edit_creator(((storage.foldername(name))[1])::uuid)
  );

-- Suppression : créateurs ou admin
CREATE POLICY IF NOT EXISTS audio_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'audio'
    AND (
      public.can_edit_creator(((storage.foldername(name))[1])::uuid)
      OR public.is_admin(auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Permissions Streaming OS
-- ---------------------------------------------------------------------------
INSERT INTO public.permissions (code, description) VALUES
  ('stream:play',               'Écouter des morceaux'),
  ('stream:playlist:create',    'Créer des playlists'),
  ('stream:playlist:edit',      'Modifier ses playlists'),
  ('stream:library:manage',     'Gérer sa bibliothèque'),
  ('stream:analytics:view:own', 'Voir ses statistiques d''écoute'),
  ('admin:stream:analytics',    'Voir toutes les statistiques streaming')
ON CONFLICT (code) DO NOTHING;

-- Auditeur et artiste peuvent streamer
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('auditeur', 'artiste', 'auditeur_artiste')
  AND p.code IN (
    'stream:play',
    'stream:playlist:create',
    'stream:playlist:edit',
    'stream:library:manage',
    'stream:analytics:view:own'
  )
ON CONFLICT DO NOTHING;

-- Admin a tous les droits streaming
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
  AND p.code IN (
    'stream:play',
    'stream:playlist:create',
    'stream:playlist:edit',
    'stream:library:manage',
    'stream:analytics:view:own',
    'admin:stream:analytics'
  )
ON CONFLICT DO NOTHING;

-- Artiste peut voir ses propres analytics de streams
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('artiste', 'auditeur_artiste')
  AND p.code = 'stream:analytics:view:own'
ON CONFLICT DO NOTHING;
