-- Admin cockpit dashboard — GRANT SELECT service_role (tables manquantes)
-- Symptôme : permission denied 42501 sur audit_logs → crash page /admin
-- ---------------------------------------------------------------------------

BEGIN;

GRANT SELECT ON public.audit_logs TO service_role;
GRANT SELECT ON public.creator_verifications TO service_role;
GRANT SELECT ON public.creators TO service_role;
GRANT SELECT ON public.user_roles TO service_role;
GRANT SELECT ON public.roles TO service_role;

COMMIT;
