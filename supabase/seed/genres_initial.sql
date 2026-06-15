-- SONAFRIK — Seed données genres musicaux
-- Exécuter dans Supabase Dashboard > SQL Editor
-- Utilise ON CONFLICT DO UPDATE pour réactiver les genres existants
-- Sécurisé : peut être relancé plusieurs fois sans effet de bord

INSERT INTO public.genres (name, slug, description, sort_order, is_active)
VALUES
  ('Afrobeat',        'afrobeat',        'Rythmes afro contemporains',                 1,  true),
  ('Mandingue',       'mandingue',       'Traditions Manding de Guinée',               2,  true),
  ('Rap GN',          'rap-gn',          'Hip-hop guinéen',                            3,  true),
  ('Gospel',          'gospel',          'Musique gospel africaine',                   4,  true),
  ('Reggae',          'reggae',          'Reggae & dancehall',                         5,  true),
  ('Pop Africaine',   'pop-africaine',   'Pop continentale africaine',                 6,  true),
  ('Traditionnel',    'traditionnel',    'Musiques traditionnelles de Guinée',         7,  true),
  ('Soukous',         'soukous',         'Rumba africaine électrisée',                 8,  true),
  ('Afropop',         'afropop',         'Pop africaine moderne',                      9,  true),
  ('Jazz Africain',   'jazz-africain',   'Jazz aux influences africaines',             10, true),
  ('Highlife',        'highlife',        'Highlife ouest-africain',                    11, true),
  ('Coupé-Décalé',    'coupe-decale',    'Danse ivoirienne exportée sur le continent', 12, true),
  ('Zouk',            'zouk',            'Zouk des îles adapté à l''Afrique',         13, true),
  ('R&B Africain',    'rnb-africain',    'R&B aux couleurs africaines',               14, true)
ON CONFLICT (slug) DO UPDATE
  SET is_active  = true,
      sort_order = EXCLUDED.sort_order,
      description = EXCLUDED.description;
