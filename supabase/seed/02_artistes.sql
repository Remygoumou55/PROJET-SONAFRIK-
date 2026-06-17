-- ============================================================
-- SONAFRIK Sprint G-1 — Seed 02 : Artistes (5 profils demo)
-- Idempotent — ON CONFLICT DO NOTHING / DO UPDATE partout
-- Ordre d'exécution : 2/5 (après 01_genres.sql)
-- ============================================================
-- UUIDs fixes :
--   Users   : a100000{1-5}-0000-4000-8000-0000000000{01-05}
--   Creators: c100000{1-5}-0000-4000-8000-0000000000{01-05}
-- ============================================================

DO $$
DECLARE
  -- UUIDs des 5 artistes
  u1 UUID := 'a1000001-0000-4000-8000-000000000001'; -- Alpha Diallo
  u2 UUID := 'a1000002-0000-4000-8000-000000000002'; -- Faya
  u3 UUID := 'a1000003-0000-4000-8000-000000000003'; -- Djeli Sow
  u4 UUID := 'a1000004-0000-4000-8000-000000000004'; -- MC Fly
  u5 UUID := 'a1000005-0000-4000-8000-000000000005'; -- SeK
  c1 UUID := 'c1000001-0000-4000-8000-000000000001';
  c2 UUID := 'c1000002-0000-4000-8000-000000000002';
  c3 UUID := 'c1000003-0000-4000-8000-000000000003';
  c4 UUID := 'c1000004-0000-4000-8000-000000000004';
  c5 UUID := 'c1000005-0000-4000-8000-000000000005';
BEGIN

  -- Désactiver le trigger bugué (notifications.category manquante en prod)
  ALTER TABLE public.profiles DISABLE TRIGGER on_profile_created_preferences;

  -- ─── 1. auth.users ────────────────────────────────────────────
  -- Le trigger handle_new_user() créera les profiles automatiquement.

  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'alpha-diallo@sonafrik-demo.gn', '', now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Mamadou Alpha Kouyaté"}'::jsonb,
     now(), now(), '', '', '', ''),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'faya@sonafrik-demo.gn', '', now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Fatoumata Bah"}'::jsonb,
     now(), now(), '', '', '', ''),
    (u3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'djeli-sow@sonafrik-demo.gn', '', now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Ibrahima Djeli Sow"}'::jsonb,
     now(), now(), '', '', '', ''),
    (u4, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'mc-fly@sonafrik-demo.gn', '', now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Mariama Camara"}'::jsonb,
     now(), now(), '', '', '', ''),
    (u5, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'sek@sonafrik-demo.gn', '', now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Sékou Condé"}'::jsonb,
     now(), now(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- Réactiver le trigger
  ALTER TABLE public.profiles ENABLE TRIGGER on_profile_created_preferences;

  -- ─── 2. auth.identities ───────────────────────────────────────
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), u1, 'alpha-diallo@sonafrik-demo.gn',
     jsonb_build_object('sub', u1::text, 'email', 'alpha-diallo@sonafrik-demo.gn'),
     'email', now(), now(), now()),
    (gen_random_uuid(), u2, 'faya@sonafrik-demo.gn',
     jsonb_build_object('sub', u2::text, 'email', 'faya@sonafrik-demo.gn'),
     'email', now(), now(), now()),
    (gen_random_uuid(), u3, 'djeli-sow@sonafrik-demo.gn',
     jsonb_build_object('sub', u3::text, 'email', 'djeli-sow@sonafrik-demo.gn'),
     'email', now(), now(), now()),
    (gen_random_uuid(), u4, 'mc-fly@sonafrik-demo.gn',
     jsonb_build_object('sub', u4::text, 'email', 'mc-fly@sonafrik-demo.gn'),
     'email', now(), now(), now()),
    (gen_random_uuid(), u5, 'sek@sonafrik-demo.gn',
     jsonb_build_object('sub', u5::text, 'email', 'sek@sonafrik-demo.gn'),
     'email', now(), now(), now())
  ON CONFLICT DO NOTHING;

  -- ─── 3. UPDATE profiles (trigger les a déjà créés) ────────────
  UPDATE public.profiles SET
    full_name            = 'Mamadou Alpha Kouyaté',
    account_type         = 'artiste',
    locale               = 'fr',
    onboarding_completed = true,
    is_premium           = false,
    fraud_score          = 0,
    updated_at           = now()
  WHERE id = u1;

  UPDATE public.profiles SET
    full_name            = 'Fatoumata Bah',
    account_type         = 'artiste',
    locale               = 'fr',
    onboarding_completed = true,
    is_premium           = false,
    fraud_score          = 0,
    updated_at           = now()
  WHERE id = u2;

  UPDATE public.profiles SET
    full_name            = 'Ibrahima Djeli Sow',
    account_type         = 'artiste',
    locale               = 'fr',
    onboarding_completed = true,
    is_premium           = false,
    fraud_score          = 0,
    updated_at           = now()
  WHERE id = u3;

  UPDATE public.profiles SET
    full_name            = 'Mariama Camara',
    account_type         = 'artiste',
    locale               = 'fr',
    onboarding_completed = true,
    is_premium           = false,
    fraud_score          = 0,
    updated_at           = now()
  WHERE id = u4;

  UPDATE public.profiles SET
    full_name            = 'Sékou Condé',
    account_type         = 'artiste',
    locale               = 'fr',
    onboarding_completed = true,
    is_premium           = false,
    fraud_score          = 0,
    updated_at           = now()
  WHERE id = u5;

  -- ─── 4. creators ──────────────────────────────────────────────
  INSERT INTO public.creators (id, owner_id, status, tier, created_by, updated_by)
  VALUES
    (c1, u1, 'active', 'etabli', u1, u1),
    (c2, u2, 'active', 'etabli', u2, u2),
    (c3, u3, 'active', 'etabli', u3, u3),
    (c4, u4, 'active', 'etabli', u4, u4),
    (c5, u5, 'active', 'etabli', u5, u5)
  ON CONFLICT (id) DO NOTHING;

  -- ─── 5. creator_roles (owner) ─────────────────────────────────
  INSERT INTO public.creator_roles (creator_id, member_id, role, accepted_at, updated_by)
  VALUES
    (c1, u1, 'owner', now(), u1),
    (c2, u2, 'owner', now(), u2),
    (c3, u3, 'owner', now(), u3),
    (c4, u4, 'owner', now(), u4),
    (c5, u5, 'owner', now(), u5)
  ON CONFLICT (creator_id, member_id) DO NOTHING;

  -- ─── 6. artist_profiles ───────────────────────────────────────
  INSERT INTO public.artist_profiles
    (creator_id, stage_name, slug, bio, genres, is_public, verified, verified_at, updated_by)
  VALUES
    (c1,
     'Alpha Diallo',
     'alpha-diallo',
     'Alpha Diallo est un artiste afrobeat originaire de Conakry qui fusionne les rythmes traditionnels guinéens avec les sonorités électroniques modernes. Ses compositions portent les couleurs du Djoliba et l''énergie de Kaloum dans chaque battement.',
     ARRAY['Afrobeat', 'Pop Africaine'],
     true, true, now(), u1),
    (c2,
     'Faya',
     'faya',
     'Fatoumata Bah, alias Faya, est une voix féminine singulière du R&B africain, née à Labé au cœur du Fouta Djallon. Elle mêle la douceur des ballades peules à la modernité du R&B continental pour créer un son unique et envoûtant.',
     ARRAY['R&B Africain', 'Pop Africaine'],
     true, true, now(), u2),
    (c3,
     'Djeli Sow',
     'djeli-sow',
     'Ibrahima Djeli Sow perpétue la tradition griottique mandingue de Kankan tout en l''électrisant de sonorités contemporaines. Maître de la kora et du balafon, il raconte les épopées de l''empire manding avec les outils du XXIe siècle.',
     ARRAY['Traditionnel', 'Mandingue'],
     true, true, now(), u3),
    (c4,
     'MC Fly',
     'mc-fly',
     'Mariama Camara, alias MC Fly, est la voix du rap guinéen qui monte. Issue des rues de Kaloum à Conakry, elle rappe avec une franchise et une énergie qui résonnent dans toute la jeunesse guinéenne. Son flow acéré mêle wolof, soussou et français.',
     ARRAY['Rap GN'],
     true, true, now(), u4),
    (c5,
     'SeK',
     'sek',
     'Sékou Condé, alias SeK, est la figure montante du gospel guinéen. Né à Kindia dans une famille de choristes, il apporte une dimension spirituelle profonde à la scène musicale guinéenne, alliant chants liturgiques et arrangements contemporains.',
     ARRAY['Gospel'],
     true, true, now(), u5)
  ON CONFLICT (creator_id) DO UPDATE SET
    stage_name  = EXCLUDED.stage_name,
    bio         = EXCLUDED.bio,
    genres      = EXCLUDED.genres,
    is_public   = EXCLUDED.is_public,
    verified    = EXCLUDED.verified,
    updated_by  = EXCLUDED.updated_by;

  -- ─── 7. Rôles utilisateurs ────────────────────────────────────
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT uid, r.id FROM (VALUES (u1),(u2),(u3),(u4),(u5)) AS t(uid)
  CROSS JOIN public.roles r WHERE r.name = 'artiste'
  ON CONFLICT DO NOTHING;

END $$;

-- ─── Validation ───────────────────────────────────────────────────
SELECT
  COUNT(*) FILTER (WHERE account_type = 'artiste') AS nb_artistes,
  COUNT(*) FILTER (WHERE onboarding_completed = true) AS onboarding_ok
FROM public.profiles
WHERE id IN (
  'a1000001-0000-4000-8000-000000000001',
  'a1000002-0000-4000-8000-000000000002',
  'a1000003-0000-4000-8000-000000000003',
  'a1000004-0000-4000-8000-000000000004',
  'a1000005-0000-4000-8000-000000000005'
);
-- Attendu : nb_artistes=5, onboarding_ok=5

SELECT stage_name, slug, verified FROM public.artist_profiles ORDER BY stage_name;
-- Attendu : 5 lignes, verified=true partout
