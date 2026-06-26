-- =========================================================================
-- Vague A — subscription_plans branché dans subscribe_premium RPC
-- Date : 2026-06-24 | A3 — tarifs source de vérité DB
-- =========================================================================

BEGIN;

-- Plan annuel premium (absent du seed initial)
INSERT INTO public.subscription_plans (name, slug, price_gnf, features, sort_order)
VALUES
  (
    'Premium Annuel',
    'premium-annual',
    480000,
    '{"ads": false, "quality": "high", "offline": true, "billing_period": "annual"}',
    2
  )
ON CONFLICT (slug) DO UPDATE
SET
  price_gnf  = EXCLUDED.price_gnf,
  features   = EXCLUDED.features,
  is_active  = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Réordonner artiste après les plans premium
UPDATE public.subscription_plans
SET sort_order = 3, updated_at = now()
WHERE slug = 'artiste';

-- ---------------------------------------------------------------------------
-- RPC subscribe_premium — prix depuis subscription_plans (plus de hardcode)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.subscribe_premium(
  p_plan_type TEXT DEFAULT 'monthly'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet public.wallets%ROWTYPE;
  v_plan_slug TEXT := CASE p_plan_type
    WHEN 'monthly' THEN 'premium'
    WHEN 'annual'  THEN 'premium-annual'
    ELSE NULL
  END;
  v_plan public.subscription_plans%ROWTYPE;
  v_price_gnf NUMERIC;
  v_duration INTERVAL := CASE p_plan_type
    WHEN 'monthly' THEN INTERVAL '1 month'
    WHEN 'annual'  THEN INTERVAL '1 year'
    ELSE NULL
  END;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF v_plan_slug IS NULL OR v_duration IS NULL THEN
    RAISE EXCEPTION 'plan_not_found';
  END IF;

  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE slug = v_plan_slug AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'plan_not_found';
  END IF;

  v_price_gnf := v_plan.price_gnf;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;

  IF v_wallet.balance_gnf < v_price_gnf THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  SELECT CASE
    WHEN p.is_premium AND p.premium_expires_at > now()
      THEN p.premium_expires_at + v_duration
    ELSE now() + v_duration
  END INTO v_expires_at
  FROM public.profiles p WHERE p.id = v_user_id;

  UPDATE public.wallets
  SET balance_gnf        = balance_gnf - v_price_gnf,
      total_debited_gnf  = total_debited_gnf + v_price_gnf
  WHERE user_id = v_user_id;

  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf, reason, metadata
  ) VALUES (
    v_wallet.id, v_user_id, 'debit', v_price_gnf,
    v_wallet.balance_gnf - v_price_gnf,
    'subscription',
    jsonb_build_object(
      'plan_type', p_plan_type,
      'plan_slug', v_plan_slug,
      'plan_id', v_plan.id,
      'expires_at', v_expires_at
    )
  );

  UPDATE public.profiles
  SET is_premium         = true,
      premium_expires_at = v_expires_at
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', v_expires_at,
    'amount_debited_gnf', v_price_gnf,
    'plan_type', p_plan_type,
    'plan_slug', v_plan_slug
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
