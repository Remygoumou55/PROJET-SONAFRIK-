-- Bêta MVP : réactiver l'écoute pour tous les comptes actifs tant que les paiements prod
-- ne sont pas validés (Orange Money Phase 2). Désactiver via admin quand l'abonnement est live.

BEGIN;

INSERT INTO public.system_settings (key, value, description, category)
VALUES (
  'streaming_free_access_enabled',
  'true'::jsonb,
  'Accès streaming gratuit pour tous les comptes actifs (bêta). Passer à false quand les abonnements sont en production.',
  'streaming'
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

CREATE OR REPLACE FUNCTION public.has_streaming_permission(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_user_id
      AND p.deleted_at IS NULL
      AND (
        COALESCE(
          (
            SELECT ss.value
            FROM public.system_settings ss
            WHERE ss.key = 'streaming_free_access_enabled'
            LIMIT 1
          ),
          'false'::jsonb
        ) = 'true'::jsonb
        OR (p.is_premium = true AND p.premium_expires_at IS NOT NULL AND p.premium_expires_at > now())
        OR (p.created_at + INTERVAL '7 days' > now())
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_streaming_permission TO authenticated, anon;

COMMIT;
