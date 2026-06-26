-- Performance — activation des flags sûrs pour beta (cache recherche + animations CDC)
BEGIN;

UPDATE public.feature_flags
SET enabled = true, updated_at = now()
WHERE name IN (
  'performance_search_cache_enabled',
  'performance_animation_cdc_compliant_enabled'
);

COMMIT;
