-- Performance & UX Certification — feature flags (all disabled by default)
BEGIN;

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  (
    'performance_lazy_loading_enabled',
    false,
    'Active le lazy loading étendu (modales, sections lourdes) — Phase E'
  ),
  (
    'performance_bundle_split_enabled',
    false,
    'Active le code splitting agressif par route — Phase E'
  ),
  (
    'performance_prefetch_enabled',
    false,
    'Active le prefetch sélectif des routes listener — Phase F'
  ),
  (
    'performance_streaming_ssr_enabled',
    false,
    'Active le SSR partiel des sections homepage /listen — Phase F'
  ),
  (
    'performance_search_cache_enabled',
    false,
    'Active le cache client des recherches récentes — Phase J'
  ),
  (
    'performance_skeleton_extended_enabled',
    false,
    'Active les skeletons étendus (onboarding, legal) — Phase G'
  ),
  (
    'performance_animation_cdc_compliant_enabled',
    false,
    'Réduit les animations >300ms vers conformité CDC — Phase G'
  ),
  (
    'performance_africa_mode_enabled',
    false,
    'Active le profil Africa Mode (qualité réseau, images, prefetch réduit) — Phase H'
  )
ON CONFLICT (name) DO NOTHING;

COMMIT;
