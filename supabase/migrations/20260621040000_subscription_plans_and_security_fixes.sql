-- =========================================================================
-- Migration : subscription_plans + sécurisation admin_dashboard_stats
-- Date : 2026-06-21 | Sprint Vague D — Audit forensique V1/V2/V3
-- =========================================================================

BEGIN;

-- ─── 1. TABLE subscription_plans (absente de la DB live, référencée dans ADMIN_GUIDE) ───

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        UNIQUE NOT NULL,
  price_gnf   integer     NOT NULL CHECK (price_gnf >= 0),
  features    jsonb       NOT NULL DEFAULT '{}',
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Lecture publique des plans actifs (visiteurs et abonnés peuvent voir les tarifs)
CREATE POLICY "plans_public_read"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Écriture réservée aux admins
CREATE POLICY "plans_admin_all"
  ON public.subscription_plans
  FOR ALL
  USING (is_admin(auth.uid()));

-- Plans de base SONAFRIK
INSERT INTO public.subscription_plans (name, slug, price_gnf, features, sort_order)
VALUES
  ('Écoute Gratuite', 'gratuit',  0,      '{"ads": true,  "quality": "standard", "offline": false}', 0),
  ('Premium',         'premium',  50000,  '{"ads": false, "quality": "high",     "offline": true}',  1),
  ('Artiste Pro',     'artiste',  100000, '{"ads": false, "quality": "lossless", "offline": true, "distribution": true}', 2)
ON CONFLICT (slug) DO NOTHING;


-- ─── 2. Sécurisation admin_dashboard_stats ────────────────────────────────────────────
-- La vue exposait des agrégats financiers (montants, paiements, soldes wallet)
-- à tous les utilisateurs authentifiés ET anonymes.
-- Seuls les admins (is_admin()) et le service_role doivent y accéder.

REVOKE SELECT ON public.admin_dashboard_stats FROM anon;
REVOKE SELECT ON public.admin_dashboard_stats FROM authenticated;

-- Le service_role (backend admin) garde l'accès
GRANT SELECT ON public.admin_dashboard_stats TO service_role;


-- ─── 3. trigger updated_at pour subscription_plans ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER set_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
