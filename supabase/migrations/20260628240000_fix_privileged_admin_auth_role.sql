-- Fix _is_privileged_admin : auth.role() est fiable via PostgREST (service_role key)
-- current_setting('request.jwt.claim.role') peut être vide selon le chemin d'appel.

BEGIN;

CREATE OR REPLACE FUNCTION public._is_privileged_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));
$$;

COMMIT;
