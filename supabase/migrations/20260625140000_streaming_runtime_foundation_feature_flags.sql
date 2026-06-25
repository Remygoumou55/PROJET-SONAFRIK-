-- Sprint 2.1 — Streaming Runtime Foundation feature flags (all disabled by default)
BEGIN;

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  (
    'streaming_runtime_enabled',
    false,
    'Active le Streaming Runtime Coordinator (SPRING 2.1+)'
  ),
  (
    'runtime_application_layer_enabled',
    false,
    'Active la couche Application CQRS du Streaming Runtime'
  ),
  (
    'runtime_contracts_enabled',
    false,
    'Active les contrats formels runtime (events, ports, adapters)'
  ),
  (
    'runtime_ports_enabled',
    false,
    'Active l injection des ports runtime (session, playback, legacy)'
  ),
  (
    'runtime_events_enabled',
    false,
    'Active la publication Domain Events via bus runtime'
  ),
  (
    'runtime_context_enabled',
    false,
    'Active le Runtime Context formel (correlation, ownership)'
  )
ON CONFLICT (name) DO NOTHING;

COMMIT;
