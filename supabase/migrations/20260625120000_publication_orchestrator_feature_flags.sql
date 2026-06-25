-- Phase 5 — Publication Orchestrator feature flags (all disabled by default)
BEGIN;

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  (
    'publication_orchestrator_enabled',
    false,
    'Route submit track/album via Publication Orchestrator (progressive rollout)'
  ),
  (
    'metadata_validation_enabled',
    false,
    'Active la validation metadata dans le pipeline publication'
  ),
  (
    'isrc_reservation_enabled',
    false,
    'Reserve ISRC reel (interne, invisible UI)'
  ),
  (
    'publication_persistence_enabled',
    false,
    'Ecritures metadata persistence dans le pipeline publication'
  ),
  (
    'publication_real_publish_enabled',
    false,
    'Le pipeline orchestrateur remplace le submit legacy (etape 5)'
  )
ON CONFLICT (name) DO NOTHING;

COMMIT;
