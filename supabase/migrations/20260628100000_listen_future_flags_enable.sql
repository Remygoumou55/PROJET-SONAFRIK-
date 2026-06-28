-- Activation des fonctionnalités futures /listen (Sprint 1–3) — visibles en prod/bêta
BEGIN;

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  (
    'listen_fullscreen_player',
    true,
    'Player plein écran immersif (cover vinyl, onglets) — /listen'
  ),
  (
    'listen_queue_panel',
    true,
    'Panneau file d''attente dans le player — /listen'
  ),
  (
    'listen_whatsapp_share',
    true,
    'Partage WhatsApp / Web Share API sur les morceaux — /listen'
  ),
  (
    'listen_discover_mode',
    true,
    'Mode Découverte — radio basée sur l''historique d''écoute — /listen'
  ),
  (
    'listen_synchronized_lyrics',
    true,
    'Paroles synchronisées (table track_lyrics) — /listen'
  )
ON CONFLICT (name) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  description = EXCLUDED.description,
  updated_at = now();

COMMIT;
