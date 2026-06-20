-- Sprint 4 — RLS Creator OS

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_verifications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- labels
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS labels_select_public ON public.labels
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND verified = true);

CREATE POLICY IF NOT EXISTS labels_select_member ON public.labels
  FOR SELECT TO authenticated
  USING (public.is_label_member(id) OR public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS labels_insert_artist ON public.labels
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND public.is_artist_account(auth.uid())
  );

CREATE POLICY IF NOT EXISTS labels_update_manage ON public.labels
  FOR UPDATE TO authenticated
  USING (public.can_manage_label(id))
  WITH CHECK (public.can_manage_label(id));

-- ---------------------------------------------------------------------------
-- creators
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS creators_select_member ON public.creators
  FOR SELECT TO authenticated
  USING (public.is_creator_member(id) OR public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS creators_select_public_active ON public.creators
  FOR SELECT TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.artist_profiles ap
      WHERE ap.creator_id = id AND ap.is_public = true
    )
  );

CREATE POLICY IF NOT EXISTS creators_insert_own ON public.creators
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_artist_account(auth.uid()));

CREATE POLICY IF NOT EXISTS creators_update_manage ON public.creators
  FOR UPDATE TO authenticated
  USING (public.can_manage_creator(id))
  WITH CHECK (public.can_manage_creator(id));

-- ---------------------------------------------------------------------------
-- artist_profiles
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS artist_profiles_select_public ON public.artist_profiles
  FOR SELECT TO anon, authenticated
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.creators c
      WHERE c.id = creator_id AND c.deleted_at IS NULL AND c.status = 'active'
    )
  );

CREATE POLICY IF NOT EXISTS artist_profiles_select_member ON public.artist_profiles
  FOR SELECT TO authenticated
  USING (public.is_creator_member(creator_id) OR public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS artist_profiles_update_edit ON public.artist_profiles
  FOR UPDATE TO authenticated
  USING (public.can_edit_creator(creator_id))
  WITH CHECK (public.can_edit_creator(creator_id));

-- ---------------------------------------------------------------------------
-- creator_roles (teams)
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS creator_roles_select_member ON public.creator_roles
  FOR SELECT TO authenticated
  USING (public.is_creator_member(creator_id) OR public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS creator_roles_insert_manage ON public.creator_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_creator(creator_id));

CREATE POLICY IF NOT EXISTS creator_roles_update_manage ON public.creator_roles
  FOR UPDATE TO authenticated
  USING (public.can_manage_creator(creator_id))
  WITH CHECK (public.can_manage_creator(creator_id));

CREATE POLICY IF NOT EXISTS creator_roles_delete_manage ON public.creator_roles
  FOR DELETE TO authenticated
  USING (public.can_manage_creator(creator_id) AND role <> 'owner');

-- ---------------------------------------------------------------------------
-- label_members
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS label_members_select_member ON public.label_members
  FOR SELECT TO authenticated
  USING (public.is_label_member(label_id) OR public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS label_members_insert_manage ON public.label_members
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_label(label_id));

CREATE POLICY IF NOT EXISTS label_members_update_manage ON public.label_members
  FOR UPDATE TO authenticated
  USING (public.can_manage_label(label_id))
  WITH CHECK (public.can_manage_label(label_id));

CREATE POLICY IF NOT EXISTS label_members_delete_manage ON public.label_members
  FOR DELETE TO authenticated
  USING (public.can_manage_label(label_id) AND role <> 'owner');

-- ---------------------------------------------------------------------------
-- studios
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS studios_select_member ON public.studios
  FOR SELECT TO authenticated
  USING (public.is_creator_member(creator_id) OR public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS studios_insert_edit ON public.studios
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_creator(creator_id));

CREATE POLICY IF NOT EXISTS studios_update_edit ON public.studios
  FOR UPDATE TO authenticated
  USING (public.can_edit_creator(creator_id))
  WITH CHECK (public.can_edit_creator(creator_id));

CREATE POLICY IF NOT EXISTS studios_delete_manage ON public.studios
  FOR DELETE TO authenticated
  USING (public.can_manage_creator(creator_id));

-- ---------------------------------------------------------------------------
-- creator_verifications
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS creator_verifications_select_member ON public.creator_verifications
  FOR SELECT TO authenticated
  USING (public.is_creator_member(creator_id) OR public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS creator_verifications_insert_edit ON public.creator_verifications
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_creator(creator_id));

CREATE POLICY IF NOT EXISTS creator_verifications_update_edit ON public.creator_verifications
  FOR UPDATE TO authenticated
  USING (public.can_edit_creator(creator_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.can_edit_creator(creator_id) OR public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage creator-assets — {creator_id}/*
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS creator_assets_select_member ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'creator-assets'
    AND public.is_creator_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY IF NOT EXISTS creator_assets_insert_edit ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'creator-assets'
    AND public.can_edit_creator(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY IF NOT EXISTS creator_assets_update_edit ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'creator-assets'
    AND public.can_edit_creator(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY IF NOT EXISTS creator_assets_delete_manage ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'creator-assets'
    AND public.can_manage_creator(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- Permissions Creator OS
-- ---------------------------------------------------------------------------
INSERT INTO public.permissions (code, description) VALUES
  ('creator:read:own', 'Lire son espace créateur'),
  ('creator:update:own', 'Modifier son espace créateur'),
  ('creator:team:manage', 'Gérer l''équipe créateur'),
  ('creator:verification:submit', 'Soumettre une vérification'),
  ('creator:studio:manage', 'Gérer les studios'),
  ('label:create', 'Créer un label'),
  ('label:manage:own', 'Gérer son label'),
  ('label:team:manage', 'Gérer l''équipe label'),
  ('admin:creator:verify', 'Valider les vérifications créateur')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('artiste', 'auditeur_artiste')
  AND p.code IN (
    'creator:read:own', 'creator:update:own', 'creator:team:manage',
    'creator:verification:submit', 'creator:studio:manage',
    'label:create', 'label:manage:own', 'label:team:manage'
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
  AND p.code IN (
    'creator:read:own', 'creator:update:own', 'creator:team:manage',
    'creator:verification:submit', 'creator:studio:manage',
    'label:create', 'label:manage:own', 'label:team:manage',
    'admin:creator:verify'
  )
ON CONFLICT DO NOTHING;
