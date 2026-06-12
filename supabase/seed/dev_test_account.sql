-- ============================================================
-- SEED — Compte de test développement local SONAFRIK
-- À exécuter uniquement sur supabase start (instance locale)
-- NE JAMAIS exécuter en production ou staging
-- ============================================================

DO $$
DECLARE
  v_user_id  uuid := '00000000-0000-4000-8000-000000000001';
  v_email    text := 'dev@sonafrik.local';
  v_password text := 'DevSonafrik2026!';
BEGIN

  -- ── 1. Utilisateur auth ─────────────────────────────────
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Dev SONAFRIK"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Identity (auth.identities) ───────────────────────
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_user_id,
    v_email,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- ── 3. Profil public ────────────────────────────────────
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    account_type,
    locale,
    onboarding_completed,
    is_premium,
    premium_expires_at,
    fraud_score,
    created_at,
    updated_at,
    deleted_at
  )
  VALUES (
    v_user_id,
    v_email,
    'Dev SONAFRIK',
    'auditeur_artiste',
    'fr',
    true,
    false,
    NULL,
    0,
    NOW(),
    NOW(),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. Rôle auditeur_artiste ────────────────────────────
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT v_user_id, r.id
  FROM public.roles r
  WHERE r.name = 'auditeur_artiste'
  ON CONFLICT DO NOTHING;

END $$;
