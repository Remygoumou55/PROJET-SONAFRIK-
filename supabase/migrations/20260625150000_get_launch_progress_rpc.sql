-- Migration : RPC get_launch_progress (alignée DB live)
-- Existe déjà en production — permet fresh install depuis le repo.
-- À exécuter manuellement dans Supabase SQL Editor si absent.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_launch_progress()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'current', (
      SELECT COUNT(*)
        FROM public.profiles
       WHERE is_premium = true
         AND premium_expires_at > now()
         AND deleted_at IS NULL
    ),
    'target', (
      SELECT COALESCE((value::text)::bigint, 2000)
        FROM public.system_settings
       WHERE key = 'launch_subscriber_target'
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_launch_progress() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_launch_progress() TO anon, authenticated;

COMMENT ON FUNCTION public.get_launch_progress() IS
  'Statistiques agrégées de progression lancement (abonnés premium actifs / objectif).';

COMMIT;
