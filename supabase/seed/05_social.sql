-- ============================================================
-- SONAFRIK Sprint G-1 — Seed 05 : Favoris + Playlists officielles
-- Idempotent — ON CONFLICT DO NOTHING partout
-- Ordre d'exécution : 5/5 (après 04_streams.sql)
-- ============================================================

DO $$
DECLARE
  u1 UUID := 'a1000001-0000-4000-8000-000000000001'; -- Alpha Diallo
  u2 UUID := 'a1000002-0000-4000-8000-000000000002'; -- Faya
  u3 UUID := 'a1000003-0000-4000-8000-000000000003'; -- Djeli Sow
  u4 UUID := 'a1000004-0000-4000-8000-000000000004'; -- MC Fly
  u5 UUID := 'a1000005-0000-4000-8000-000000000005'; -- SeK

  -- UUIDs playlists
  pl1 UUID := 'f1000001-0000-4000-8000-000000000001'; -- Top Guinée Juillet 2026
  pl2 UUID := 'f1000002-0000-4000-8000-000000000002'; -- Gospel du Dimanche
  pl3 UUID := 'f1000003-0000-4000-8000-000000000003'; -- Afro Vibes GN

  -- Track UUIDs (subset)
  t01 UUID := 'e0000001-0000-4000-8000-000000000001'; -- Sunrise Conakry
  t07 UUID := 'e0000002-0000-4000-8000-000000000001'; -- Mon Amour Fouta
  t13 UUID := 'e0000003-0000-4000-8000-000000000001'; -- Chant du Griot
  t15 UUID := 'e0000003-0000-4000-8000-000000000003'; -- Kora Blues
  t19 UUID := 'e0000004-0000-4000-8000-000000000001'; -- Kaloum City
  t20 UUID := 'e0000004-0000-4000-8000-000000000002'; -- Freestyle Conakry
  t21 UUID := 'e0000004-0000-4000-8000-000000000003'; -- Vrai Depuis Toujours
  t25 UUID := 'e0000005-0000-4000-8000-000000000001'; -- Grâce Infinie
  t26 UUID := 'e0000005-0000-4000-8000-000000000002'; -- Louange du Matin
  t28 UUID := 'e0000005-0000-4000-8000-000000000004'; -- Alléluia Guinéen

  -- Album UUID
  ab11 UUID := 'a0b00001-0000-4000-8000-000000000001'; -- Conakry Vibes
  ab21 UUID := 'a0b00002-0000-4000-8000-000000000001'; -- Cœur de Fouta

BEGIN

  -- ─── 1. FAVORIS ────────────────────────────────────────────
  -- Chaque artiste met en favoris quelques tracks des autres
  INSERT INTO public.favorites (user_id, entity_type, entity_id)
  VALUES
    -- Alpha Diallo aime Faya et MC Fly
    (u1, 'track',  t07),
    (u1, 'track',  t19),
    (u1, 'track',  t20),
    (u1, 'album',  ab21),
    -- Faya aime Alpha et SeK
    (u2, 'track',  t01),
    (u2, 'track',  t25),
    (u2, 'track',  t26),
    -- Djeli Sow aime Alpha et Faya
    (u3, 'track',  t01),
    (u3, 'track',  t07),
    -- MC Fly aime SeK et Djeli Sow
    (u4, 'track',  t13),
    (u4, 'track',  t25),
    (u4, 'track',  t28),
    -- SeK aime MC Fly
    (u5, 'track',  t19),
    (u5, 'track',  t21),
    -- Favoris artistes croisés
    (u1, 'artist', 'c1000002-0000-4000-8000-000000000002'::uuid),
    (u2, 'artist', 'c1000001-0000-4000-8000-000000000001'::uuid),
    (u4, 'artist', 'c1000005-0000-4000-8000-000000000005'::uuid),
    (u5, 'artist', 'c1000004-0000-4000-8000-000000000004'::uuid)
  ON CONFLICT DO NOTHING;

  -- ─── 2. PLAYLISTS OFFICIELLES SONAFRIK ─────────────────────
  -- Note : track_count est mis à jour automatiquement par trigger
  INSERT INTO public.playlists
    (id, user_id, title, description, is_public)
  VALUES
    (pl1, u4,
     'Top Guinée Juillet 2026',
     'Les meilleurs morceaux guinéens du mois de juillet 2026, sélectionnés par SONAFRIK.',
     true),
    (pl2, u5,
     'Gospel du Dimanche',
     'Les voix de la foi guinéenne — une sélection pour commencer la semaine avec lumière et paix.',
     true),
    (pl3, u1,
     'Afro Vibes GN',
     'Afrobeat, R&B et sons modernes venus de Guinée. La playlist pour bouger sur la musique guinéenne.',
     true)
  ON CONFLICT (id) DO NOTHING;

  -- ─── 3. PLAYLIST TRACKS ────────────────────────────────────
  -- Playlist 1 : Top Guinée Juillet 2026
  INSERT INTO public.playlist_tracks (playlist_id, track_id, position, added_by)
  VALUES
    (pl1, t19, 0, u4), -- Kaloum City (MC Fly)
    (pl1, t20, 1, u4), -- Freestyle Conakry
    (pl1, t07, 2, u4), -- Mon Amour Fouta (Faya)
    (pl1, t01, 3, u4), -- Sunrise Conakry (Alpha)
    (pl1, t21, 4, u4), -- Vrai Depuis Toujours
    (pl1, t08, 5, u4), -- Pita Douceur (Faya)
    (pl1, t15, 6, u4), -- Kora Blues (Djeli)
    (pl1, t25, 7, u4)  -- Grâce Infinie (SeK)
  ON CONFLICT DO NOTHING;

  -- Playlist 2 : Gospel du Dimanche
  INSERT INTO public.playlist_tracks (playlist_id, track_id, position, added_by)
  VALUES
    (pl2, t25, 0, u5), -- Grâce Infinie
    (pl2, t26, 1, u5), -- Louange du Matin
    (pl2, t28, 2, u5), -- Alléluia Guinéen
    (pl2, t29, 3, u5), -- Cantique du Soir
    (pl2, t30, 4, u5)  -- Béni Soit
  ON CONFLICT DO NOTHING;

  -- Playlist 3 : Afro Vibes GN
  INSERT INTO public.playlist_tracks (playlist_id, track_id, position, added_by)
  VALUES
    (pl3, t01, 0, u1), -- Sunrise Conakry
    (pl3, t07, 1, u1), -- Mon Amour Fouta
    (pl3, t19, 2, u1), -- Kaloum City
    (pl3, t02, 3, u1), -- Djoliba Flow
    (pl3, t13, 4, u1)  -- Chant du Griot
  ON CONFLICT DO NOTHING;

END $$;

-- ─── Validation ───────────────────────────────────────────────────
SELECT COUNT(*) AS nb_favorites FROM public.favorites;
-- Attendu : 18

SELECT p.title, p.track_count, p.is_public
FROM public.playlists p
WHERE p.id IN (
  'f1000001-0000-4000-8000-000000000001',
  'f1000002-0000-4000-8000-000000000002',
  'f1000003-0000-4000-8000-000000000003'
)
ORDER BY p.title;
-- Attendu : 3 playlists publiques, track_count mis à jour par trigger (8, 5, 5)
