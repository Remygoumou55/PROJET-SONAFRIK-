-- =========================================================================
-- Vague A — GRANT service_role sur subscription_plans
-- Date : 2026-07-05 | A3 — probe:finance-chain D2-subscription-plans
-- Cause : service_role avait REFERENCES/TRIGGER/TRUNCATE mais pas SELECT
-- =========================================================================

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_plans TO service_role;

-- Réactivation idempotente des plans MVP (au cas où désactivés en admin)
UPDATE public.subscription_plans SET is_active = true, updated_at = now()
WHERE slug IN ('gratuit', 'premium', 'premium-annual', 'artiste');

INSERT INTO public.subscription_plans (name, slug, price_gnf, features, sort_order, is_active)
VALUES
  ('Écoute Gratuite', 'gratuit',  0,      '{"ads": true,  "quality": "standard", "offline": false}', 0, true),
  ('Premium',         'premium',  50000,  '{"ads": false, "quality": "high",     "offline": true}',  1, true),
  ('Premium Annuel',  'premium-annual', 480000, '{"ads": false, "quality": "high", "offline": true, "billing_period": "annual"}', 2, true),
  ('Artiste Pro',     'artiste',  100000, '{"ads": false, "quality": "lossless", "offline": true, "distribution": true}', 3, true)
ON CONFLICT (slug) DO UPDATE
SET
  price_gnf  = EXCLUDED.price_gnf,
  features   = EXCLUDED.features,
  is_active  = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

COMMIT;
