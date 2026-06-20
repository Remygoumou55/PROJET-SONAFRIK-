-- Sprint 8 — Wallet OS
-- SONAFRIK CDC V9.0 · Revenue Pool 65% · wallet_ledger INSERT ONLY

-- ---------------------------------------------------------------------------
-- Add premium fields to profiles (CDC Règle #2 : Premium J1 · Gratuit J8)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_premium
  ON public.profiles(is_premium, premium_expires_at)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- wallets — un portefeuille par utilisateur (créé automatiquement)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_gnf NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (balance_gnf >= 0),
  currency TEXT NOT NULL DEFAULT 'GNF',
  total_credited_gnf NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_debited_gnf NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER wallets_set_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- ---------------------------------------------------------------------------
-- wallet_ledger — INSERT ONLY (CDC identique à audit_logs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('credit', 'debit')),
  amount_gnf NUMERIC(15,2) NOT NULL CHECK (amount_gnf > 0),
  balance_after_gnf NUMERIC(15,2) NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'topup', 'subscription', 'royalty', 'tip', 'refund', 'withdrawal', 'commission'
  )),
  reference_id UUID,
  reference_type TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.prevent_wallet_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'wallet_ledger is INSERT ONLY — direct UPDATE/DELETE forbidden';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_ledger_insert_only
  BEFORE UPDATE OR DELETE ON public.wallet_ledger
  FOR EACH ROW EXECUTE FUNCTION public.prevent_wallet_ledger_mutation();

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet_id ON public.wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_id ON public.wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created_at ON public.wallet_ledger(created_at DESC);

-- ---------------------------------------------------------------------------
-- transactions — paiements, top-ups, abonnements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  type TEXT NOT NULL CHECK (type IN (
    'topup', 'subscription', 'tip', 'beat_purchase', 'withdrawal', 'royalty_payout', 'refund'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'failed', 'cancelled', 'refunded'
  )),
  amount_gnf NUMERIC(15,2) NOT NULL CHECK (amount_gnf > 0),
  commission_gnf NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (commission_gnf >= 0),
  net_amount_gnf NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GNF',
  payment_method TEXT CHECK (payment_method IN (
    'orange_money', 'mtn_momo', 'wave', 'card', 'internal'
  )),
  payment_reference TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER transactions_set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- ---------------------------------------------------------------------------
-- withdrawals — demandes de retrait
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  payout_account_id UUID NOT NULL,
  amount_gnf NUMERIC(15,2) NOT NULL CHECK (amount_gnf >= 5000),
  fee_gnf NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (fee_gnf >= 0),
  net_amount_gnf NUMERIC(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  reference TEXT,
  rejection_reason TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER withdrawals_set_updated_at
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- ---------------------------------------------------------------------------
-- payout_accounts — comptes de retrait (Orange Money, MTN, Wave, virement)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('orange_money', 'mtn_momo', 'wave', 'bank_transfer')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT NOT NULL,
  phone_number TEXT,
  iban TEXT,
  bank_name TEXT,
  account_holder_name TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER payout_accounts_set_updated_at
  BEFORE UPDATE ON public.payout_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_payout_accounts_user ON public.payout_accounts(user_id)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- royalty_cycles — cycles de distribution (mensuel)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.royalty_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'calculating', 'ready', 'distributed', 'closed'
  )),
  total_valid_listens INTEGER NOT NULL DEFAULT 0,
  total_revenue_gnf NUMERIC(15,2) NOT NULL DEFAULT 0,
  revenue_pool_gnf NUMERIC(15,2) NOT NULL DEFAULT 0,
  revenue_pool_percent NUMERIC(5,2) NOT NULL DEFAULT 65.00,
  artist_count INTEGER NOT NULL DEFAULT 0,
  distributed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT royalty_cycles_period_unique UNIQUE (period_start, period_end)
);

CREATE TRIGGER royalty_cycles_set_updated_at
  BEFORE UPDATE ON public.royalty_cycles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- royalty_calculations — calculs par artiste par cycle
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.royalty_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.royalty_cycles(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.creators(id),
  valid_listen_count INTEGER NOT NULL DEFAULT 0 CHECK (valid_listen_count >= 0),
  listen_share_percent NUMERIC(10,6) NOT NULL DEFAULT 0,
  gross_amount_gnf NUMERIC(15,2) NOT NULL DEFAULT 0,
  platform_commission_gnf NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_amount_gnf NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'paid', 'cancelled'
  )),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT royalty_calculations_cycle_artist UNIQUE (cycle_id, artist_id)
);

CREATE TRIGGER royalty_calculations_set_updated_at
  BEFORE UPDATE ON public.royalty_calculations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_royalty_calculations_cycle ON public.royalty_calculations(cycle_id);
CREATE INDEX IF NOT EXISTS idx_royalty_calculations_artist ON public.royalty_calculations(artist_id);

-- ---------------------------------------------------------------------------
-- Auto-create wallet when profile is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER profiles_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_profile();

-- ---------------------------------------------------------------------------
-- RPC : get_wallet_balance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_wallet_balance(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS NUMERIC AS $$
  SELECT COALESCE(balance_gnf, 0)
  FROM public.wallets
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- RPC : subscribe_premium
-- CDC Règle #2 : période d'essai 7 jours, puis abonnement requis
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.subscribe_premium(
  p_plan_type TEXT DEFAULT 'monthly'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet public.wallets%ROWTYPE;
  v_price_gnf NUMERIC := CASE p_plan_type
    WHEN 'monthly' THEN 50000
    WHEN 'annual'  THEN 480000
    ELSE 50000
  END;
  v_duration INTERVAL := CASE p_plan_type
    WHEN 'monthly' THEN INTERVAL '1 month'
    WHEN 'annual'  THEN INTERVAL '1 year'
    ELSE INTERVAL '1 month'
  END;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;

  IF v_wallet.balance_gnf < v_price_gnf THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Prolonger si déjà premium actif
  SELECT CASE
    WHEN p.is_premium AND p.premium_expires_at > now()
      THEN p.premium_expires_at + v_duration
    ELSE now() + v_duration
  END INTO v_expires_at
  FROM public.profiles p WHERE p.id = v_user_id;

  -- Débit portefeuille
  UPDATE public.wallets
  SET balance_gnf        = balance_gnf - v_price_gnf,
      total_debited_gnf  = total_debited_gnf + v_price_gnf
  WHERE user_id = v_user_id;

  -- Entrée ledger
  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf, reason, metadata
  ) VALUES (
    v_wallet.id, v_user_id, 'debit', v_price_gnf,
    v_wallet.balance_gnf - v_price_gnf,
    'subscription',
    jsonb_build_object('plan_type', p_plan_type, 'expires_at', v_expires_at)
  );

  -- Activation premium
  UPDATE public.profiles
  SET is_premium         = true,
      premium_expires_at = v_expires_at
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', v_expires_at,
    'amount_debited_gnf', v_price_gnf,
    'plan_type', p_plan_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- RPC : add_payout_account
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_payout_account(
  p_type TEXT,
  p_display_name TEXT,
  p_account_holder_name TEXT,
  p_phone_number TEXT DEFAULT NULL,
  p_iban TEXT DEFAULT NULL,
  p_bank_name TEXT DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_account_id UUID;
BEGIN
  IF p_is_default THEN
    UPDATE public.payout_accounts
    SET is_default = false
    WHERE user_id = v_user_id AND deleted_at IS NULL;
  END IF;

  INSERT INTO public.payout_accounts (
    user_id, type, display_name, account_holder_name,
    phone_number, iban, bank_name, is_default
  ) VALUES (
    v_user_id, p_type, p_display_name, p_account_holder_name,
    p_phone_number, p_iban, p_bank_name, p_is_default
  )
  RETURNING id INTO v_account_id;

  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- RPC : request_withdrawal
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_payout_account_id UUID,
  p_amount_gnf NUMERIC
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet public.wallets%ROWTYPE;
  v_withdrawal_id UUID;
BEGIN
  IF p_amount_gnf < 5000 THEN
    RAISE EXCEPTION 'minimum_withdrawal_5000_gnf';
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.payout_accounts
    WHERE id = p_payout_account_id AND user_id = v_user_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'payout_account_not_found';
  END IF;

  IF v_wallet.balance_gnf < p_amount_gnf THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Réservation immédiate
  UPDATE public.wallets
  SET balance_gnf       = balance_gnf - p_amount_gnf,
      total_debited_gnf = total_debited_gnf + p_amount_gnf
  WHERE user_id = v_user_id;

  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf, reason, metadata
  ) VALUES (
    v_wallet.id, v_user_id, 'debit', p_amount_gnf,
    v_wallet.balance_gnf - p_amount_gnf,
    'withdrawal',
    jsonb_build_object('payout_account_id', p_payout_account_id)
  );

  INSERT INTO public.withdrawals (
    user_id, wallet_id, payout_account_id, amount_gnf, fee_gnf, net_amount_gnf
  ) VALUES (
    v_user_id, v_wallet.id, p_payout_account_id, p_amount_gnf, 0, p_amount_gnf
  )
  RETURNING id INTO v_withdrawal_id;

  RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- RPC : is_premium_user (remplace version MVP)
-- CDC Règle #2 — vérifie le statut premium réel
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_premium_user(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    is_premium AND (premium_expires_at IS NULL OR premium_expires_at > now()),
    false
  )
  FROM public.profiles WHERE id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- RPC : has_streaming_permission (remplace version MVP)
-- CDC Règle #2 — 7 jours d'essai gratuit puis premium requis
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_streaming_permission(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (is_premium AND (premium_expires_at IS NULL OR premium_expires_at > now()))
    OR (created_at + INTERVAL '7 days' > now()),
    false
  )
  FROM public.profiles WHERE id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
