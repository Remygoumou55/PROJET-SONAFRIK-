-- Sprint 3 — RLS Identity OS

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- user_preferences
CREATE POLICY IF NOT EXISTS user_preferences_select_own ON public.user_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS user_preferences_update_own ON public.user_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS user_preferences_insert_own ON public.user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS user_preferences_select_admin ON public.user_preferences
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- notifications
CREATE POLICY IF NOT EXISTS notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY IF NOT EXISTS notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Storage avatars — dossier user_id/*
CREATE POLICY IF NOT EXISTS avatars_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS avatars_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS avatars_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS avatars_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permissions Identity OS
INSERT INTO public.permissions (code, description) VALUES
  ('preferences:read:own', 'Lire ses préférences'),
  ('preferences:update:own', 'Modifier ses préférences'),
  ('notifications:read:own', 'Lire ses notifications'),
  ('notifications:update:own', 'Marquer notifications lues'),
  ('profile:delete:own', 'Demander suppression de compte')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('auditeur', 'artiste', 'auditeur_artiste')
  AND p.code IN (
    'preferences:read:own', 'preferences:update:own',
    'notifications:read:own', 'notifications:update:own',
    'profile:delete:own'
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
  AND p.code IN (
    'preferences:read:own', 'preferences:update:own',
    'notifications:read:own', 'notifications:update:own',
    'profile:delete:own'
  )
ON CONFLICT DO NOTHING;
