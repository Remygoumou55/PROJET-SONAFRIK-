-- ============================================================
-- SONAFRIK Sprint G-1 — Seed 03 : Albums + Morceaux (5×2×3)
-- 5 artistes · 2 albums chacun · 3 morceaux par album = 30 tracks
-- Idempotent — ON CONFLICT DO NOTHING partout
-- Ordre d'exécution : 3/5 (après 02_artistes.sql)
-- CORRECTION : created_by/updated_by = user UUID (FK auth.users)
--              PAS le creator UUID
-- ============================================================

DO $$
DECLARE
  -- User UUIDs (pour created_by/updated_by → FK vers auth.users)
  u1 UUID := 'a1000001-0000-4000-8000-000000000001';
  u2 UUID := 'a1000002-0000-4000-8000-000000000002';
  u3 UUID := 'a1000003-0000-4000-8000-000000000003';
  u4 UUID := 'a1000004-0000-4000-8000-000000000004';
  u5 UUID := 'a1000005-0000-4000-8000-000000000005';
  -- Creator UUIDs (pour creator_id)
  c1 UUID := 'c1000001-0000-4000-8000-000000000001';
  c2 UUID := 'c1000002-0000-4000-8000-000000000002';
  c3 UUID := 'c1000003-0000-4000-8000-000000000003';
  c4 UUID := 'c1000004-0000-4000-8000-000000000004';
  c5 UUID := 'c1000005-0000-4000-8000-000000000005';
  -- Albums
  ab11 UUID := 'a0b00001-0000-4000-8000-000000000001';
  ab12 UUID := 'a0b00001-0000-4000-8000-000000000002';
  ab21 UUID := 'a0b00002-0000-4000-8000-000000000001';
  ab22 UUID := 'a0b00002-0000-4000-8000-000000000002';
  ab31 UUID := 'a0b00003-0000-4000-8000-000000000001';
  ab32 UUID := 'a0b00003-0000-4000-8000-000000000002';
  ab41 UUID := 'a0b00004-0000-4000-8000-000000000001';
  ab42 UUID := 'a0b00004-0000-4000-8000-000000000002';
  ab51 UUID := 'a0b00005-0000-4000-8000-000000000001';
  ab52 UUID := 'a0b00005-0000-4000-8000-000000000002';
  -- Tracks
  t01 UUID := 'e0000001-0000-4000-8000-000000000001';
  t02 UUID := 'e0000001-0000-4000-8000-000000000002';
  t03 UUID := 'e0000001-0000-4000-8000-000000000003';
  t04 UUID := 'e0000001-0000-4000-8000-000000000004';
  t05 UUID := 'e0000001-0000-4000-8000-000000000005';
  t06 UUID := 'e0000001-0000-4000-8000-000000000006';
  t07 UUID := 'e0000002-0000-4000-8000-000000000001';
  t08 UUID := 'e0000002-0000-4000-8000-000000000002';
  t09 UUID := 'e0000002-0000-4000-8000-000000000003';
  t10 UUID := 'e0000002-0000-4000-8000-000000000004';
  t11 UUID := 'e0000002-0000-4000-8000-000000000005';
  t12 UUID := 'e0000002-0000-4000-8000-000000000006';
  t13 UUID := 'e0000003-0000-4000-8000-000000000001';
  t14 UUID := 'e0000003-0000-4000-8000-000000000002';
  t15 UUID := 'e0000003-0000-4000-8000-000000000003';
  t16 UUID := 'e0000003-0000-4000-8000-000000000004';
  t17 UUID := 'e0000003-0000-4000-8000-000000000005';
  t18 UUID := 'e0000003-0000-4000-8000-000000000006';
  t19 UUID := 'e0000004-0000-4000-8000-000000000001';
  t20 UUID := 'e0000004-0000-4000-8000-000000000002';
  t21 UUID := 'e0000004-0000-4000-8000-000000000003';
  t22 UUID := 'e0000004-0000-4000-8000-000000000004';
  t23 UUID := 'e0000004-0000-4000-8000-000000000005';
  t24 UUID := 'e0000004-0000-4000-8000-000000000006';
  t25 UUID := 'e0000005-0000-4000-8000-000000000001';
  t26 UUID := 'e0000005-0000-4000-8000-000000000002';
  t27 UUID := 'e0000005-0000-4000-8000-000000000003';
  t28 UUID := 'e0000005-0000-4000-8000-000000000004';
  t29 UUID := 'e0000005-0000-4000-8000-000000000005';
  t30 UUID := 'e0000005-0000-4000-8000-000000000006';
  -- Genres
  g_afrobeat UUID; g_mandingue UUID; g_rap_gn UUID;
  g_gospel UUID; g_traditionnel UUID; g_pop UUID; g_rnb UUID;
BEGIN
  SELECT id INTO g_afrobeat     FROM public.genres WHERE slug='afrobeat';
  SELECT id INTO g_mandingue    FROM public.genres WHERE slug='mandingue';
  SELECT id INTO g_rap_gn       FROM public.genres WHERE slug='rap-gn';
  SELECT id INTO g_gospel       FROM public.genres WHERE slug='gospel';
  SELECT id INTO g_traditionnel FROM public.genres WHERE slug='traditionnel';
  SELECT id INTO g_pop          FROM public.genres WHERE slug='pop-africaine';
  SELECT id INTO g_rnb          FROM public.genres WHERE slug='rnb-africain';

  -- ALBUMS (created_by/updated_by = user UUID u1..u5)
  INSERT INTO public.albums
    (id,creator_id,title,slug,release_type,release_date,
     publication_status,published_at,submitted_at,created_by,updated_by)
  VALUES
    (ab11,c1,'Conakry Vibes','conakry-vibes','album',(now()-interval'28 days')::date,
     'published',now()-interval'28 days',now()-interval'30 days',u1,u1),
    (ab12,c1,'Nuits Africaines','nuits-africaines','album',(now()-interval'180 days')::date,
     'published',now()-interval'180 days',now()-interval'182 days',u1,u1),
    (ab21,c2,'Cœur de Fouta','coeur-de-fouta','album',(now()-interval'14 days')::date,
     'published',now()-interval'14 days',now()-interval'16 days',u2,u2),
    (ab22,c2,'Solo','solo','single',(now()-interval'120 days')::date,
     'published',now()-interval'120 days',now()-interval'122 days',u2,u2),
    (ab31,c3,'Griot Électrique','griot-electrique','album',(now()-interval'45 days')::date,
     'published',now()-interval'45 days',now()-interval'47 days',u3,u3),
    (ab32,c3,'Épopées Mandingues','epopees-mandingues','album',(now()-interval'240 days')::date,
     'published',now()-interval'240 days',now()-interval'242 days',u3,u3),
    (ab41,c4,'Rue Kaloum','rue-kaloum','album',(now()-interval'7 days')::date,
     'published',now()-interval'7 days',now()-interval'9 days',u4,u4),
    (ab42,c4,'Freestyle GN','freestyle-gn','ep',(now()-interval'90 days')::date,
     'published',now()-interval'90 days',now()-interval'92 days',u4,u4),
    (ab51,c5,'Lumière','lumiere','album',(now()-interval'60 days')::date,
     'published',now()-interval'60 days',now()-interval'62 days',u5,u5),
    (ab52,c5,'Cantiques','cantiques','album',(now()-interval'150 days')::date,
     'published',now()-interval'150 days',now()-interval'152 days',u5,u5)
  ON CONFLICT (creator_id,slug) DO NOTHING;

  -- ALBUM GENRES
  INSERT INTO public.album_genres (album_id,genre_id) VALUES
    (ab11,g_afrobeat),(ab11,g_pop),(ab12,g_afrobeat),(ab12,g_pop),
    (ab21,g_rnb),(ab21,g_pop),(ab22,g_rnb),
    (ab31,g_traditionnel),(ab31,g_mandingue),(ab32,g_traditionnel),(ab32,g_mandingue),
    (ab41,g_rap_gn),(ab42,g_rap_gn),
    (ab51,g_gospel),(ab52,g_gospel)
  ON CONFLICT DO NOTHING;

  -- TRACKS — Alpha Diallo
  INSERT INTO public.tracks
    (id,creator_id,album_id,title,slug,track_number,duration_seconds,
     explicit,language,publication_status,published_at,submitted_at,created_by,updated_by)
  VALUES
    (t01,c1,ab11,'Sunrise Conakry','sunrise-conakry',1,240,false,'fr','published',now()-interval'28 days',now()-interval'30 days',u1,u1),
    (t02,c1,ab11,'Djoliba Flow','djoliba-flow',2,195,false,'fr','published',now()-interval'28 days',now()-interval'30 days',u1,u1),
    (t03,c1,ab11,'Afro Nuit','afro-nuit',3,265,false,'fr','published',now()-interval'28 days',now()-interval'30 days',u1,u1),
    (t04,c1,ab12,'Kaloum Groove','kaloum-groove',1,220,false,'fr','published',now()-interval'180 days',now()-interval'182 days',u1,u1),
    (t05,c1,ab12,'Rythme du Fleuve','rythme-du-fleuve',2,280,false,'fr','published',now()-interval'180 days',now()-interval'182 days',u1,u1),
    (t06,c1,ab12,'Syli Beat','syli-beat',3,190,false,'fr','published',now()-interval'180 days',now()-interval'182 days',u1,u1)
  ON CONFLICT (creator_id,slug) DO NOTHING;

  -- TRACKS — Faya
  INSERT INTO public.tracks
    (id,creator_id,album_id,title,slug,track_number,duration_seconds,
     explicit,language,publication_status,published_at,submitted_at,created_by,updated_by)
  VALUES
    (t07,c2,ab21,'Mon Amour Fouta','mon-amour-fouta',1,215,false,'ff','published',now()-interval'14 days',now()-interval'16 days',u2,u2),
    (t08,c2,ab21,'Pita Douceur','pita-douceur',2,250,false,'ff','published',now()-interval'14 days',now()-interval'16 days',u2,u2),
    (t09,c2,ab21,'Labé Soir','labe-soir',3,300,false,'ff','published',now()-interval'14 days',now()-interval'16 days',u2,u2),
    (t10,c2,ab22,'Solo (Acoustique)','solo-acoustique',1,190,false,'fr','published',now()-interval'120 days',now()-interval'122 days',u2,u2),
    (t11,c2,ab22,'Toi et Moi','toi-et-moi',2,240,false,'fr','published',now()-interval'120 days',now()-interval'122 days',u2,u2),
    (t12,c2,ab22,'Dernière Danse','derniere-danse',3,270,false,'fr','published',now()-interval'120 days',now()-interval'122 days',u2,u2)
  ON CONFLICT (creator_id,slug) DO NOTHING;

  -- TRACKS — Djeli Sow
  INSERT INTO public.tracks
    (id,creator_id,album_id,title,slug,track_number,duration_seconds,
     explicit,language,publication_status,published_at,submitted_at,created_by,updated_by)
  VALUES
    (t13,c3,ab31,'Chant du Griot','chant-du-griot',1,320,false,'man','published',now()-interval'45 days',now()-interval'47 days',u3,u3),
    (t14,c3,ab31,'Balafon Moderne','balafon-moderne',2,285,false,'man','published',now()-interval'45 days',now()-interval'47 days',u3,u3),
    (t15,c3,ab31,'Kora Blues','kora-blues',3,340,false,'man','published',now()-interval'45 days',now()-interval'47 days',u3,u3),
    (t16,c3,ab32,'Soundjata','soundjata',1,295,false,'man','published',now()-interval'240 days',now()-interval'242 days',u3,u3),
    (t17,c3,ab32,'Manden Fily','manden-fily',2,260,false,'man','published',now()-interval'240 days',now()-interval'242 days',u3,u3),
    (t18,c3,ab32,'Donsomori','donsomori',3,310,false,'man','published',now()-interval'240 days',now()-interval'242 days',u3,u3)
  ON CONFLICT (creator_id,slug) DO NOTHING;

  -- TRACKS — MC Fly
  INSERT INTO public.tracks
    (id,creator_id,album_id,title,slug,track_number,duration_seconds,
     explicit,language,publication_status,published_at,submitted_at,created_by,updated_by)
  VALUES
    (t19,c4,ab41,'Kaloum City','kaloum-city',1,195,false,'fr','published',now()-interval'7 days',now()-interval'9 days',u4,u4),
    (t20,c4,ab41,'Freestyle Conakry','freestyle-conakry',2,235,false,'fr','published',now()-interval'7 days',now()-interval'9 days',u4,u4),
    (t21,c4,ab41,'Vrai Depuis Toujours','vrai-depuis-toujours',3,255,false,'fr','published',now()-interval'7 days',now()-interval'9 days',u4,u4),
    (t22,c4,ab42,'GN Mon Amour','gn-mon-amour',1,220,false,'fr','published',now()-interval'90 days',now()-interval'92 days',u4,u4),
    (t23,c4,ab42,'Rap Game Guinée','rap-game-guinee',2,200,false,'fr','published',now()-interval'90 days',now()-interval'92 days',u4,u4),
    (t24,c4,ab42,'Soro Mo','soro-mo',3,240,false,'sus','published',now()-interval'90 days',now()-interval'92 days',u4,u4)
  ON CONFLICT (creator_id,slug) DO NOTHING;

  -- TRACKS — SeK
  INSERT INTO public.tracks
    (id,creator_id,album_id,title,slug,track_number,duration_seconds,
     explicit,language,publication_status,published_at,submitted_at,created_by,updated_by)
  VALUES
    (t25,c5,ab51,'Grâce Infinie','grace-infinie',1,285,false,'fr','published',now()-interval'60 days',now()-interval'62 days',u5,u5),
    (t26,c5,ab51,'Louange du Matin','louange-du-matin',2,310,false,'fr','published',now()-interval'60 days',now()-interval'62 days',u5,u5),
    (t27,c5,ab51,'Kiri Yé','kiri-ye',3,260,false,'sus','published',now()-interval'60 days',now()-interval'62 days',u5,u5),
    (t28,c5,ab52,'Alléluia Guinéen','alleluia-guineen',1,290,false,'fr','published',now()-interval'150 days',now()-interval'152 days',u5,u5),
    (t29,c5,ab52,'Cantique du Soir','cantique-du-soir',2,275,false,'fr','published',now()-interval'150 days',now()-interval'152 days',u5,u5),
    (t30,c5,ab52,'Béni Soit','beni-soit',3,300,false,'fr','published',now()-interval'150 days',now()-interval'152 days',u5,u5)
  ON CONFLICT (creator_id,slug) DO NOTHING;

  -- TRACK GENRES
  INSERT INTO public.track_genres (track_id,genre_id) VALUES
    (t01,g_afrobeat),(t01,g_pop),(t02,g_afrobeat),(t02,g_pop),
    (t03,g_afrobeat),(t03,g_pop),(t04,g_afrobeat),(t04,g_pop),
    (t05,g_afrobeat),(t05,g_pop),(t06,g_afrobeat),(t06,g_pop),
    (t07,g_rnb),(t08,g_rnb),(t09,g_rnb),(t10,g_rnb),(t11,g_rnb),(t12,g_rnb),
    (t13,g_traditionnel),(t13,g_mandingue),(t14,g_traditionnel),(t14,g_mandingue),
    (t15,g_traditionnel),(t15,g_mandingue),(t16,g_traditionnel),(t16,g_mandingue),
    (t17,g_traditionnel),(t17,g_mandingue),(t18,g_traditionnel),(t18,g_mandingue),
    (t19,g_rap_gn),(t20,g_rap_gn),(t21,g_rap_gn),(t22,g_rap_gn),(t23,g_rap_gn),(t24,g_rap_gn),
    (t25,g_gospel),(t26,g_gospel),(t27,g_gospel),(t28,g_gospel),(t29,g_gospel),(t30,g_gospel)
  ON CONFLICT DO NOTHING;

  -- TRACK FILES (chemins fictifs — pas de vrai audio)
  INSERT INTO public.track_files (track_id,format,bitrate_kbps,file_path,file_size_bytes,is_primary) VALUES
    (t01,'mp3',128,'demo/e0000001-0000-4000-8000-000000000001/128.mp3',4700000,true),
    (t02,'mp3',128,'demo/e0000001-0000-4000-8000-000000000002/128.mp3',3800000,true),
    (t03,'mp3',128,'demo/e0000001-0000-4000-8000-000000000003/128.mp3',5200000,true),
    (t04,'mp3',128,'demo/e0000001-0000-4000-8000-000000000004/128.mp3',4300000,true),
    (t05,'mp3',128,'demo/e0000001-0000-4000-8000-000000000005/128.mp3',5500000,true),
    (t06,'mp3',128,'demo/e0000001-0000-4000-8000-000000000006/128.mp3',3700000,true),
    (t07,'mp3',128,'demo/e0000002-0000-4000-8000-000000000001/128.mp3',4200000,true),
    (t08,'mp3',128,'demo/e0000002-0000-4000-8000-000000000002/128.mp3',4900000,true),
    (t09,'mp3',128,'demo/e0000002-0000-4000-8000-000000000003/128.mp3',5900000,true),
    (t10,'mp3',128,'demo/e0000002-0000-4000-8000-000000000004/128.mp3',3700000,true),
    (t11,'mp3',128,'demo/e0000002-0000-4000-8000-000000000005/128.mp3',4700000,true),
    (t12,'mp3',128,'demo/e0000002-0000-4000-8000-000000000006/128.mp3',5300000,true),
    (t13,'mp3',128,'demo/e0000003-0000-4000-8000-000000000001/128.mp3',6300000,true),
    (t14,'mp3',128,'demo/e0000003-0000-4000-8000-000000000002/128.mp3',5600000,true),
    (t15,'mp3',128,'demo/e0000003-0000-4000-8000-000000000003/128.mp3',6700000,true),
    (t16,'mp3',128,'demo/e0000003-0000-4000-8000-000000000004/128.mp3',5800000,true),
    (t17,'mp3',128,'demo/e0000003-0000-4000-8000-000000000005/128.mp3',5100000,true),
    (t18,'mp3',128,'demo/e0000003-0000-4000-8000-000000000006/128.mp3',6100000,true),
    (t19,'mp3',128,'demo/e0000004-0000-4000-8000-000000000001/128.mp3',3800000,true),
    (t20,'mp3',128,'demo/e0000004-0000-4000-8000-000000000002/128.mp3',4600000,true),
    (t21,'mp3',128,'demo/e0000004-0000-4000-8000-000000000003/128.mp3',5000000,true),
    (t22,'mp3',128,'demo/e0000004-0000-4000-8000-000000000004/128.mp3',4300000,true),
    (t23,'mp3',128,'demo/e0000004-0000-4000-8000-000000000005/128.mp3',3900000,true),
    (t24,'mp3',128,'demo/e0000004-0000-4000-8000-000000000006/128.mp3',4700000,true),
    (t25,'mp3',128,'demo/e0000005-0000-4000-8000-000000000001/128.mp3',5600000,true),
    (t26,'mp3',128,'demo/e0000005-0000-4000-8000-000000000002/128.mp3',6100000,true),
    (t27,'mp3',128,'demo/e0000005-0000-4000-8000-000000000003/128.mp3',5100000,true),
    (t28,'mp3',128,'demo/e0000005-0000-4000-8000-000000000004/128.mp3',5700000,true),
    (t29,'mp3',128,'demo/e0000005-0000-4000-8000-000000000005/128.mp3',5400000,true),
    (t30,'mp3',128,'demo/e0000005-0000-4000-8000-000000000006/128.mp3',5900000,true)
  ON CONFLICT DO NOTHING;

END $$;

-- Validation
SELECT COUNT(*) AS nb_albums FROM public.albums WHERE publication_status='published';
-- Attendu : 10
SELECT COUNT(*) AS nb_tracks FROM public.tracks WHERE publication_status='published';
-- Attendu : 30
SELECT COUNT(*) AS nb_files  FROM public.track_files WHERE is_primary=true;
-- Attendu : 30
