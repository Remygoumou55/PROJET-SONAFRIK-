-- Live Control MVP — préparation fondateur (idempotent)
-- 1. Rôle admin pour Rémy Goumou (connexion réelle sans BYPASS)
-- 2. Seed données test si aucun morceau publié (skip si catalog déjà peuplé)

BEGIN;

-- Rémy — compte email principal
SELECT public.assign_admin_role('36dac3f8-c58e-4a95-a93a-521f70109b35'::uuid);

-- Rémy — compte téléphone (auditeur)
SELECT public.assign_admin_role('6c24f563-f325-405e-9c14-58eeff18248a'::uuid);

-- Seed minimal uniquement si catalog vide
DO $$
DECLARE
  v_artist_user_id uuid;
  v_creator_id uuid;
  v_artist_profile_id uuid;
  v_wallet_id uuid;
  v_album_id uuid;
  v_track_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.tracks WHERE publication_status = 'published' LIMIT 1) THEN
    RAISE NOTICE 'Catalog déjà peuplé — seed ignoré';
    RETURN;
  END IF;

  v_artist_user_id := gen_random_uuid();

  INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
  VALUES (v_artist_user_id, 'artiste.test@sonafrik.dev', now(), now(), now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, account_type, full_name, phone, is_premium, deleted_at)
  VALUES (v_artist_user_id, 'artist', 'Artiste Test SONAFRIK', '+224600000001', false, null)
  ON CONFLICT (id) DO NOTHING;

  v_creator_id := gen_random_uuid();
  INSERT INTO public.creators (id, user_id, status, created_at)
  VALUES (v_creator_id, v_artist_user_id, 'active', now())
  ON CONFLICT DO NOTHING;

  v_artist_profile_id := gen_random_uuid();
  INSERT INTO public.artist_profiles (id, creator_id, stage_name, genres, created_at)
  VALUES (v_artist_profile_id, v_creator_id, 'Artiste Test', ARRAY['afrobeats']::text[], now())
  ON CONFLICT DO NOTHING;

  v_wallet_id := gen_random_uuid();
  INSERT INTO public.wallets (id, user_id, balance_gnf, created_at)
  VALUES (v_wallet_id, v_artist_user_id, 0, now())
  ON CONFLICT DO NOTHING;

  v_album_id := gen_random_uuid();
  INSERT INTO public.albums (id, creator_id, title, release_type, publication_status, created_at)
  VALUES (v_album_id, v_creator_id, 'Album Test MVP', 'single', 'published', now())
  ON CONFLICT DO NOTHING;

  v_track_id := gen_random_uuid();
  INSERT INTO public.tracks (
    id, creator_id, album_id, title,
    duration_seconds, publication_status,
    track_number, created_at
  )
  VALUES (
    v_track_id, v_creator_id, v_album_id,
    'Test Live Control',
    180, 'published',
    1, now()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Données test créées : artiste=%, track=%', v_artist_user_id, v_track_id;
END $$;

COMMIT;
