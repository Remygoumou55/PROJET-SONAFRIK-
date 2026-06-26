-- War Plan D1 + D5 — Africa Mode + prefetch sélectif (réseau GN / perf navigation)
BEGIN;

UPDATE public.feature_flags
SET enabled = true, updated_at = now()
WHERE name IN (
  'performance_africa_mode_enabled',
  'performance_prefetch_enabled'
);

COMMIT;
