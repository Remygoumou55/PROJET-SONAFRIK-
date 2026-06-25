-- Sprint 2.2 — Playback Session Engine feature flags (all disabled by default)
BEGIN;

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  (
    'streaming_session_engine_enabled',
    false,
    'Active le Playback Session Engine (SPRING 2.2)'
  ),
  (
    'streaming_session_heartbeat_enabled',
    false,
    'Active le heartbeat Session Engine (cadence 10s)'
  ),
  (
    'streaming_session_recovery_enabled',
    false,
    'Active la reprise de session (recovery / resume)'
  ),
  (
    'streaming_session_expiration_enabled',
    false,
    'Active expiration automatique des sessions inactives'
  )
ON CONFLICT (name) DO NOTHING;

COMMIT;
