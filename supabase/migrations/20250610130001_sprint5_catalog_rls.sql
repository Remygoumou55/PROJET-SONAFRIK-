-- Sprint 5 — RLS Catalog OS

ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_files ENABLE ROW LEVEL SECURITY;

-- genres — lecture publique des actifs
CREATE POLICY IF NOT EXISTS genres_select_active ON public.genres
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL AND is_active = true);

CREATE POLICY IF NOT EXISTS genres_admin_all ON public.genres
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- albums
CREATE POLICY IF NOT EXISTS albums_select_published ON public.albums
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL AND publication_status = 'published');

CREATE POLICY IF NOT EXISTS albums_select_member ON public.albums
  FOR SELECT TO authenticated
  USING (public.is_creator_member(creator_id) OR public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS albums_insert_edit ON public.albums
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_creator(creator_id));

CREATE POLICY IF NOT EXISTS albums_update_edit ON public.albums
  FOR UPDATE TO authenticated
  USING (public.can_edit_creator(creator_id))
  WITH CHECK (public.can_edit_creator(creator_id));

-- album_genres
CREATE POLICY IF NOT EXISTS album_genres_select ON public.album_genres
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS album_genres_manage ON public.album_genres
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.albums a
      WHERE a.id = album_id AND public.can_edit_creator(a.creator_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.albums a
      WHERE a.id = album_id AND public.can_edit_creator(a.creator_id)
    )
  );

-- tracks
CREATE POLICY IF NOT EXISTS tracks_select_published ON public.tracks
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL AND publication_status = 'published');

CREATE POLICY IF NOT EXISTS tracks_select_member ON public.tracks
  FOR SELECT TO authenticated
  USING (public.is_creator_member(creator_id) OR public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS tracks_insert_edit ON public.tracks
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_creator(creator_id));

CREATE POLICY IF NOT EXISTS tracks_update_edit ON public.tracks
  FOR UPDATE TO authenticated
  USING (public.can_edit_creator(creator_id))
  WITH CHECK (public.can_edit_creator(creator_id));

-- track_genres
CREATE POLICY IF NOT EXISTS track_genres_select ON public.track_genres
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS track_genres_manage ON public.track_genres
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id AND public.can_edit_creator(t.creator_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id AND public.can_edit_creator(t.creator_id)
    )
  );

-- track_files
CREATE POLICY IF NOT EXISTS track_files_select_member ON public.track_files
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id
        AND (public.is_creator_member(t.creator_id) OR t.publication_status = 'published')
    )
    OR public.is_admin(auth.uid())
  );

CREATE POLICY IF NOT EXISTS track_files_insert_edit ON public.track_files
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id AND public.can_edit_creator(t.creator_id)
    )
  );

CREATE POLICY IF NOT EXISTS track_files_update_edit ON public.track_files
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id AND public.can_edit_creator(t.creator_id)
    )
  );

-- Storage catalog-audio — {creator_id}/tracks/{track_id}/*
CREATE POLICY IF NOT EXISTS catalog_audio_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'catalog-audio'
    AND public.is_creator_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY IF NOT EXISTS catalog_audio_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'catalog-audio'
    AND public.can_edit_creator(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY IF NOT EXISTS catalog_audio_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'catalog-audio'
    AND public.can_edit_creator(((storage.foldername(name))[1])::uuid)
  );

-- Storage catalog-visuals — {creator_id}/releases/{album_id}/*
CREATE POLICY IF NOT EXISTS catalog_visuals_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'catalog-visuals'
    AND public.is_creator_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY IF NOT EXISTS catalog_visuals_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'catalog-visuals'
    AND public.can_edit_creator(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY IF NOT EXISTS catalog_visuals_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'catalog-visuals'
    AND public.can_edit_creator(((storage.foldername(name))[1])::uuid)
  );

-- Permissions Catalog OS
INSERT INTO public.permissions (code, description) VALUES
  ('catalog:read:own', 'Lire son catalogue'),
  ('catalog:create', 'Créer albums et morceaux'),
  ('catalog:update:own', 'Modifier son catalogue'),
  ('catalog:publish:submit', 'Soumettre à publication'),
  ('admin:catalog:review', 'Valider publications catalogue')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('artiste', 'auditeur_artiste')
  AND p.code IN ('catalog:read:own', 'catalog:create', 'catalog:update:own', 'catalog:publish:submit')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
  AND p.code IN (
    'catalog:read:own', 'catalog:create', 'catalog:update:own',
    'catalog:publish:submit', 'admin:catalog:review'
  )
ON CONFLICT DO NOTHING;
