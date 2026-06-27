-- Fonctionnalités futures /listen — flags désactivés par défaut (activation = décision Rémy)
BEGIN;

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  (
    'listen_fullscreen_player',
    false,
    'Player plein écran immersif (cover vinyl, onglets) — /listen'
  ),
  (
    'listen_queue_panel',
    false,
    'Panneau file d''attente dans le player full-screen — /listen'
  ),
  (
    'listen_whatsapp_share',
    false,
    'Partage WhatsApp / Web Share API sur les morceaux — /listen'
  ),
  (
    'listen_discover_mode',
    false,
    'Mode Découverte — radio basée sur l''historique d''écoute — /listen'
  ),
  (
    'listen_synchronized_lyrics',
    false,
    'Paroles synchronisées (table track_lyrics) — /listen'
  )
ON CONFLICT (name) DO NOTHING;

COMMIT;
