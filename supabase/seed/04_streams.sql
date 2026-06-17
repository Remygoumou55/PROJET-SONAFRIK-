-- ============================================================
-- SONAFRIK Sprint G-1 — Seed 04 : Stream Sessions
-- Alimente get_trending_tracks() et get_discovery_feed()
-- Idempotent — uniquement INSERT (pas de ON CONFLICT possible
--   sur stream_sessions car pas de clé métier unique)
-- SÉCURITÉ : vérifier d'abord si des sessions existent déjà
--   SELECT COUNT(*) FROM stream_sessions WHERE user_id IN (...)
-- Ordre d'exécution : 4/5 (après 03_catalog.sql)
-- ============================================================

DO $$
DECLARE
  -- Nos 5 artistes (aussi utilisés comme auditeurs entre eux)
  u1 UUID := 'a1000001-0000-4000-8000-000000000001'; -- Alpha Diallo
  u2 UUID := 'a1000002-0000-4000-8000-000000000002'; -- Faya
  u3 UUID := 'a1000003-0000-4000-8000-000000000003'; -- Djeli Sow
  u4 UUID := 'a1000004-0000-4000-8000-000000000004'; -- MC Fly
  u5 UUID := 'a1000005-0000-4000-8000-000000000005'; -- SeK

  -- 30 track UUIDs dans l'ordre
  v_tracks UUID[] := ARRAY[
    'e0000001-0000-4000-8000-000000000001'::uuid, -- t01 Sunrise Conakry
    'e0000001-0000-4000-8000-000000000002'::uuid, -- t02 Djoliba Flow
    'e0000001-0000-4000-8000-000000000003'::uuid, -- t03 Afro Nuit
    'e0000001-0000-4000-8000-000000000004'::uuid, -- t04 Kaloum Groove
    'e0000001-0000-4000-8000-000000000005'::uuid, -- t05 Rythme du Fleuve
    'e0000001-0000-4000-8000-000000000006'::uuid, -- t06 Syli Beat
    'e0000002-0000-4000-8000-000000000001'::uuid, -- t07 Mon Amour Fouta
    'e0000002-0000-4000-8000-000000000002'::uuid, -- t08 Pita Douceur
    'e0000002-0000-4000-8000-000000000003'::uuid, -- t09 Labé Soir
    'e0000002-0000-4000-8000-000000000004'::uuid, -- t10 Solo Acoustique
    'e0000002-0000-4000-8000-000000000005'::uuid, -- t11 Toi et Moi
    'e0000002-0000-4000-8000-000000000006'::uuid, -- t12 Dernière Danse
    'e0000003-0000-4000-8000-000000000001'::uuid, -- t13 Chant du Griot
    'e0000003-0000-4000-8000-000000000002'::uuid, -- t14 Balafon Moderne
    'e0000003-0000-4000-8000-000000000003'::uuid, -- t15 Kora Blues
    'e0000003-0000-4000-8000-000000000004'::uuid, -- t16 Soundjata
    'e0000003-0000-4000-8000-000000000005'::uuid, -- t17 Manden Fily
    'e0000003-0000-4000-8000-000000000006'::uuid, -- t18 Donsomori
    'e0000004-0000-4000-8000-000000000001'::uuid, -- t19 Kaloum City
    'e0000004-0000-4000-8000-000000000002'::uuid, -- t20 Freestyle Conakry
    'e0000004-0000-4000-8000-000000000003'::uuid, -- t21 Vrai Depuis Toujours
    'e0000004-0000-4000-8000-000000000004'::uuid, -- t22 GN Mon Amour
    'e0000004-0000-4000-8000-000000000005'::uuid, -- t23 Rap Game Guinée
    'e0000004-0000-4000-8000-000000000006'::uuid, -- t24 Soro Mo
    'e0000005-0000-4000-8000-000000000001'::uuid, -- t25 Grâce Infinie
    'e0000005-0000-4000-8000-000000000002'::uuid, -- t26 Louange du Matin
    'e0000005-0000-4000-8000-000000000003'::uuid, -- t27 Kiri Yé
    'e0000005-0000-4000-8000-000000000004'::uuid, -- t28 Alléluia Guinéen
    'e0000005-0000-4000-8000-000000000005'::uuid, -- t29 Cantique du Soir
    'e0000005-0000-4000-8000-000000000006'::uuid  -- t30 Béni Soit
  ];

  -- Durées en secondes (même ordre que v_tracks)
  v_durations INTEGER[] := ARRAY[
    240,195,265,220,280,190,  -- Alpha Diallo
    215,250,300,190,240,270,  -- Faya
    320,285,340,295,260,310,  -- Djeli Sow
    195,235,255,220,200,240,  -- MC Fly
    285,310,260,290,275,300   -- SeK
  ];

  -- Nombre de streams par track (popularité pondérée)
  -- Plus de streams pour les tracks récentes et les "hits"
  v_counts INTEGER[] := ARRAY[
    350,280,180,120,90,60,    -- Alpha Diallo (Sunrise Conakry en tête)
    400,320,200,150,80,50,    -- Faya (Mon Amour Fouta en tête)
    150,180,250,120,90,70,    -- Djeli Sow (Kora Blues en tête)
    500,380,280,200,150,100,  -- MC Fly (Kaloum City en tête — plus populaire)
    200,160,120,90,70,50      -- SeK
  ];

  -- Utilisateurs rotatifs (5 listeners = nos 5 artistes entre eux)
  v_users UUID[] := ARRAY[u1, u2, u3, u4, u5];

  i INTEGER;
  j INTEGER;
  v_track UUID;
  v_dur   INTEGER;
  v_count INTEGER;
  v_user  UUID;
  v_listened INTEGER;
  v_started TIMESTAMPTZ;
  v_days_ago NUMERIC;
BEGIN

  FOR i IN 1..30 LOOP
    v_track := v_tracks[i];
    v_dur   := v_durations[i];
    v_count := v_counts[i];

    FOR j IN 1..v_count LOOP
      -- Distribuer sur 30 jours de façon déterministe (pas de random)
      -- Plus récent = plus de streams (courbe décroissante)
      v_days_ago := ((j - 1)::numeric / v_count * 29) + 0.1;
      v_started  := now() - (v_days_ago * interval '1 day');

      -- Rotation circulaire des 5 utilisateurs
      v_user := v_users[((i + j - 2) % 5) + 1];

      -- 95% du morceau écouté → is_valid_listen = true
      v_listened := ROUND(v_dur * 0.95);

      INSERT INTO public.stream_sessions (
        user_id, track_id,
        platform, quality_kbps,
        started_at, last_heartbeat_at, completed_at,
        total_listened_seconds, total_duration_seconds,
        listen_percentage, is_valid_listen,
        fraud_flags
      ) VALUES (
        v_user, v_track,
        'web', 128,
        v_started,
        v_started + (v_listened * interval '1 second'),
        v_started + (v_listened * interval '1 second'),
        v_listened, v_dur,
        95.0, true,
        '{}'
      );
    END LOOP;
  END LOOP;

END $$;

-- ─── Validation ───────────────────────────────────────────────────
SELECT COUNT(*) AS nb_sessions FROM public.stream_sessions WHERE is_valid_listen = true;
-- Attendu : ~5430 (somme de tous les v_counts)

-- Top 5 tracks tendances (7 derniers jours)
SELECT
  t.title,
  ap.stage_name AS artiste,
  COUNT(ss.id) AS ecoutes_7j
FROM public.stream_sessions ss
JOIN public.tracks t ON t.id = ss.track_id
JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
WHERE ss.is_valid_listen = true
  AND ss.started_at >= now() - interval '7 days'
GROUP BY t.title, ap.stage_name
ORDER BY ecoutes_7j DESC
LIMIT 5;
-- Attendu : Kaloum City (MC Fly) en tête
