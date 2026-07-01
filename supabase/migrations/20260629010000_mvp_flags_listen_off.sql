-- Certification B3 — seuls flags MVP + war-plan perf restent ON
BEGIN;

UPDATE public.feature_flags
SET enabled = false, updated_at = now()
WHERE name LIKE 'listen_%'
  AND enabled = true;

COMMIT;
