-- SONAFRIK — Sprint G-4 · Infrastructure paiements mobiles africains
-- Table payment_intents + webhook confirmation RPC
-- RÈGLE FINANCIÈRE : jamais de crédit wallet avant confirmation opérateur (confirm_payment_intent)

-- ---------------------------------------------------------------------------
-- Table : payment_intents
-- Représente une intention de paiement en attente de confirmation opérateur.
-- Cycle de vie : initiated → pending → confirmed | failed | expired
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id      UUID NOT NULL REFERENCES public.wallets(id),
  provider       TEXT NOT NULL CHECK (provider IN (
                   'orange_money_gn', 'mtn_momo_gn', 'wave_gn', 'soutra_money'
                 )),
  purpose        TEXT NOT NULL CHECK (purpose IN (
                   'topup',
                   'subscription_daily', 'subscription_weekly',
                   'subscription_monthly', 'subscription_yearly',
                   'subscription_diaspora'
                 )),
  amount_gnf     NUMERIC(15,2) NOT NULL CHECK (amount_gnf > 0),
  currency       TEXT NOT NULL DEFAULT 'GNF',
  provider_ref   TEXT,
  provider_phone TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN (
                   'initiated', 'pending', 'confirmed', 'failed', 'expired', 'refunded'
                 )),
  metadata       JSONB NOT NULL DEFAULT '{}',
  initiated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at   TIMESTAMPTZ,
  failed_at      TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER payment_intents_set_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_payment_intents_user_status ON public.payment_intents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider_ref ON public.payment_intents(provider_ref) WHERE provider_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_intents_expires_at   ON public.payment_intents(expires_at)   WHERE status IN ('initiated', 'pending');

-- ---------------------------------------------------------------------------
-- RLS : l'utilisateur voit ses propres intents ; service_role voit tout
-- ---------------------------------------------------------------------------
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Utilisateur — voir ses payment_intents"
  ON public.payment_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Utilisateur — créer ses payment_intents"
  ON public.payment_intents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- FONCTION : expire_stale_payment_intents
-- Appelée par cron ou manuellement. Expire les intents non confirmés.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_stale_payment_intents()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.payment_intents
  SET status     = 'expired',
      updated_at = now()
  WHERE status IN ('initiated', 'pending')
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_stale_payment_intents() TO service_role;

-- ---------------------------------------------------------------------------
-- FONCTION : confirm_payment_intent
-- Appelée UNIQUEMENT par les Edge Functions webhook (service_role).
-- Garantit l'atomicité : confirmation intent + crédit wallet dans une seule transaction.
-- RÈGLE : jamais exposée aux clients authentifiés (GRANT TO service_role uniquement).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_payment_intent(
  p_intent_id    UUID,
  p_provider_ref TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent      public.payment_intents%ROWTYPE;
  v_wallet      public.wallets%ROWTYPE;
  v_tx_id       UUID;
  v_dup_tx_id   UUID;
  v_new_balance NUMERIC;
BEGIN
  -- 1. Récupérer et verrouiller l'intent (prévient les doubles confirmations concurrentes)
  SELECT * INTO v_intent
  FROM public.payment_intents
  WHERE id = p_intent_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'intent_not_found';
  END IF;

  -- 2. Idempotence : intent déjà confirmé → retourner sans erreur
  IF v_intent.status = 'confirmed' THEN
    SELECT balance_gnf INTO v_new_balance
    FROM public.wallets WHERE id = v_intent.wallet_id;
    RETURN jsonb_build_object(
      'wallet_id',   v_intent.wallet_id,
      'new_balance', v_new_balance,
      'idempotent',  true
    );
  END IF;

  -- 3. Vérifier que l'intent est confirmable
  IF v_intent.status NOT IN ('initiated', 'pending') THEN
    RAISE EXCEPTION 'intent_not_confirmable : statut %', v_intent.status;
  END IF;

  -- 4. Vérifier l'expiration
  IF v_intent.expires_at < now() THEN
    UPDATE public.payment_intents
    SET status = 'expired', updated_at = now()
    WHERE id = p_intent_id;
    RAISE EXCEPTION 'expired';
  END IF;

  -- 5. Confirmer l'intent
  UPDATE public.payment_intents
  SET status       = 'confirmed',
      provider_ref = p_provider_ref,
      confirmed_at = now(),
      updated_at   = now()
  WHERE id = p_intent_id;

  -- 6. Traitement selon purpose
  IF v_intent.purpose = 'topup' THEN

    -- Idempotence transaction : une référence intent = un seul crédit
    SELECT id INTO v_dup_tx_id
    FROM public.transactions
    WHERE payment_reference = p_intent_id::TEXT
      AND type              = 'topup'
      AND status            = 'completed'
    LIMIT 1;

    IF v_dup_tx_id IS NOT NULL THEN
      SELECT balance_gnf INTO v_new_balance FROM public.wallets WHERE id = v_intent.wallet_id;
      RETURN jsonb_build_object('wallet_id', v_intent.wallet_id, 'new_balance', v_new_balance, 'idempotent', true);
    END IF;

    -- Verrouiller le wallet
    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE id = v_intent.wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'wallet_not_found';
    END IF;

    -- Créer la transaction
    INSERT INTO public.transactions (
      user_id, wallet_id, type, status,
      amount_gnf, commission_gnf, net_amount_gnf,
      currency, payment_method, payment_reference,
      description, metadata, processed_at
    ) VALUES (
      v_intent.user_id, v_intent.wallet_id, 'topup', 'completed',
      v_intent.amount_gnf, 0, v_intent.amount_gnf,
      'GNF', v_intent.provider, p_intent_id::TEXT,
      'Recharge via ' || v_intent.provider,
      jsonb_build_object(
        'intent_id',    p_intent_id,
        'provider',     v_intent.provider,
        'provider_ref', p_provider_ref,
        'phone',        v_intent.provider_phone
      ),
      now()
    ) RETURNING id INTO v_tx_id;

    -- Créditer le wallet
    UPDATE public.wallets
    SET balance_gnf        = balance_gnf + v_intent.amount_gnf,
        total_credited_gnf = total_credited_gnf + v_intent.amount_gnf,
        updated_at         = now()
    WHERE id = v_intent.wallet_id;

    -- Entrée ledger immuable
    INSERT INTO public.wallet_ledger (
      wallet_id, user_id, entry_type, amount_gnf,
      balance_after_gnf, reason, reference_id, reference_type, metadata
    ) VALUES (
      v_intent.wallet_id, v_intent.user_id, 'credit', v_intent.amount_gnf,
      v_wallet.balance_gnf + v_intent.amount_gnf,
      'topup',
      v_tx_id, 'transactions',
      jsonb_build_object('provider', v_intent.provider, 'intent_id', p_intent_id)
    );

    -- Audit (acteur = user du paiement, pas le service_role)
    PERFORM public.log_audit_event(
      v_intent.user_id,
      'wallet.topup_confirmed',
      'payment_intent',
      p_intent_id::TEXT,
      jsonb_build_object(
        'provider',    v_intent.provider,
        'amount_gnf',  v_intent.amount_gnf,
        'provider_ref', p_provider_ref
      )
    );

    v_new_balance := v_wallet.balance_gnf + v_intent.amount_gnf;

  -- TODO Sprint G-5 : purpose subscription_* → activer premium sans crédit/débit wallet
  -- ELSIF v_intent.purpose LIKE 'subscription_%' THEN ...
  ELSE
    v_new_balance := (SELECT balance_gnf FROM public.wallets WHERE id = v_intent.wallet_id);
  END IF;

  RETURN jsonb_build_object(
    'wallet_id',   v_intent.wallet_id,
    'new_balance', v_new_balance,
    'idempotent',  false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_payment_intent(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_payment_intent(UUID, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Validation
-- ---------------------------------------------------------------------------
-- SELECT COUNT(*) FROM public.payment_intents; → 0 (table vide, créée avec succès)
-- SELECT public.expire_stale_payment_intents(); → 0 (rien à expirer)
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'confirm_payment_intent';
--   → doit retourner la définition de la fonction
