-- Sprint 2.3 — Playback Runtime Engine feature flags (all disabled by default)
BEGIN;

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  (
    'streaming_playback_engine_enabled',
    false,
    'Active le Playback Runtime Engine (SPRING 2.3)'
  ),
  (
    'streaming_playback_buffer_enabled',
    false,
    'Active le buffer management Playback Runtime'
  ),
  (
    'streaming_playback_recovery_enabled',
    false,
    'Active la recovery réseau Playback Runtime'
  ),
  (
    'streaming_playback_quality_enabled',
    false,
    'Active le quality management Playback Runtime'
  ),
  (
    'streaming_playback_signed_url_enabled',
    false,
    'Active le flux signed URL Playback Runtime'
  )
ON CONFLICT (name) DO NOTHING;

COMMIT;
