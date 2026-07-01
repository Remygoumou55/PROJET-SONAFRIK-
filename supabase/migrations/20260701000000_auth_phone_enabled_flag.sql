-- Auth simplification : Google-only par défaut, OTP téléphone réactivable via flag
BEGIN;

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  (
    'auth_phone_enabled',
    false,
    'Connexion OTP SMS — OFF = Google uniquement côté UI (backend OTP conservé)'
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = now()
WHERE public.feature_flags.description IS DISTINCT FROM EXCLUDED.description;

CREATE OR REPLACE FUNCTION public.get_auth_feature_flags()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'auth_phone_enabled',
    COALESCE(
      (SELECT enabled FROM public.feature_flags WHERE name = 'auth_phone_enabled'),
      false
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_auth_feature_flags() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_feature_flags() TO anon, authenticated, service_role;

COMMIT;
