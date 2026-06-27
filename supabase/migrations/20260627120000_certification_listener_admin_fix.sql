-- Certification probes A/C/D — compte listener test ne doit pas être admin.
-- assign_admin_role réservé au service_role uniquement.

BEGIN;

DELETE FROM public.user_roles ur
USING public.roles r, auth.users u
WHERE ur.role_id = r.id
  AND ur.user_id = u.id
  AND r.name = 'admin'
  AND u.email = 's13b-playwright-listener@sonafrik.test';

REVOKE EXECUTE ON FUNCTION public.assign_admin_role(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.assign_admin_role(UUID) TO service_role;

COMMIT;
