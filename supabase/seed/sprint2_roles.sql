-- Sprint 2 — Seed rôles et permissions

INSERT INTO public.roles (name, description) VALUES
  ('auditeur', 'Auditeur — écoute et interaction'),
  ('artiste', 'Artiste — publication et revenus'),
  ('auditeur_artiste', 'Auditeur et Artiste — écoute et publication'),
  ('admin', 'Administrateur SONAFRIK — back-office complet')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (code, description) VALUES
  ('profile:read:own', 'Lire son propre profil'),
  ('profile:update:own', 'Modifier son propre profil'),
  ('session:read:own', 'Voir ses sessions actives'),
  ('session:revoke:own', 'Révoquer ses sessions'),
  ('auth:otp:request', 'Demander un code OTP SMS'),
  ('auth:otp:verify', 'Vérifier un code OTP SMS'),
  ('admin:audit:read', 'Lire les journaux d''audit'),
  ('admin:users:manage', 'Gérer les utilisateurs'),
  ('admin:settings:manage', 'Modifier les paramètres système')
ON CONFLICT (code) DO NOTHING;

-- auditeur
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'auditeur'
  AND p.code IN ('profile:read:own', 'profile:update:own', 'session:read:own', 'session:revoke:own', 'auth:otp:request', 'auth:otp:verify')
ON CONFLICT DO NOTHING;

-- artiste
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'artiste'
  AND p.code IN ('profile:read:own', 'profile:update:own', 'session:read:own', 'session:revoke:own', 'auth:otp:request', 'auth:otp:verify')
ON CONFLICT DO NOTHING;

-- auditeur_artiste
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'auditeur_artiste'
  AND p.code IN ('profile:read:own', 'profile:update:own', 'session:read:own', 'session:revoke:own', 'auth:otp:request', 'auth:otp:verify')
ON CONFLICT DO NOTHING;

-- admin — toutes permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;
