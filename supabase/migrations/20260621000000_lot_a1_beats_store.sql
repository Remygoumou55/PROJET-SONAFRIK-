-- LOT A1 - Beat Store : tables beats + beat_purchases + RPC purchase_beat
-- CDC Regle #4 : commission beat = 0 GNF
-- Corrige aussi l'index GIN manquant de 20260620_search_indexes.sql

-- ---------------------------------------------------------------------------
-- Table : beats
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beats (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id         UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title              TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  slug               TEXT        NOT NULL,
  description        TEXT        CHECK (description IS NULL OR char_length(description) <= 500),
  price_gnf          NUMERIC     NOT NULL DEFAULT 0 CHECK (price_gnf >= 0),
  bpm                INTEGER     CHECK (bpm BETWEEN 40 AND 300),
  key                TEXT        CHECK (key IS NULL OR char_length(key) <= 10),
  genre              TEXT        CHECK (genre IS NULL OR char_length(genre) <= 50),
  tags               TEXT[]      NOT NULL DEFAULT '{}',
  cover_path         TEXT,
  audio_preview_path TEXT,
  audio_full_path    TEXT,
  license_type       TEXT        NOT NULL DEFAULT 'non_exclusive'
                                 CHECK (license_type IN ('non_exclusive', 'exclusive', 'free')),
  publication_status TEXT        NOT NULL DEFAULT 'draft'
                                 CHECK (publication_status IN ('draft', 'published', 'archived')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ,
  CONSTRAINT beats_creator_slug_unique UNIQUE (creator_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_beats_creator_id
  ON public.beats(creator_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_beats_publication_status
  ON public.beats(publication_status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index trigramme (corrige l'index manquant de 20260620_search_indexes.sql)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_beats_title_trgm
  ON public.beats USING gin (title gin_trgm_ops)
  WHERE deleted_at IS NULL AND publication_status = 'published';

ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beats_select_published"  ON public.beats;
DROP POLICY IF EXISTS "beats_select_own"         ON public.beats;
DROP POLICY IF EXISTS "beats_insert_creator"     ON public.beats;
DROP POLICY IF EXISTS "beats_update_own"         ON public.beats;
DROP POLICY IF EXISTS "beats_admin_all"          ON public.beats;

CREATE POLICY "beats_select_published" ON public.beats
  FOR SELECT USING (publication_status = 'published' AND deleted_at IS NULL);

CREATE POLICY "beats_select_own" ON public.beats
  FOR SELECT TO authenticated
  USING (
    creator_id IN (
      SELECT id FROM public.creators WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "beats_insert_creator" ON public.beats
  FOR INSERT TO authenticated
  WITH CHECK (
    creator_id IN (
      SELECT id FROM public.creators
      WHERE owner_id = auth.uid() AND deleted_at IS NULL
    )
  );

CREATE POLICY "beats_update_own" ON public.beats
  FOR UPDATE TO authenticated
  USING (
    creator_id IN (
      SELECT id FROM public.creators WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "beats_admin_all" ON public.beats
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS set_updated_at_beats ON public.beats;
CREATE TRIGGER set_updated_at_beats
  BEFORE UPDATE ON public.beats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table : beat_purchases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beat_purchases (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id       UUID        NOT NULL REFERENCES auth.users(id)      ON DELETE RESTRICT,
  beat_id        UUID        NOT NULL REFERENCES public.beats(id)    ON DELETE RESTRICT,
  creator_id     UUID        NOT NULL REFERENCES public.creators(id) ON DELETE RESTRICT,
  amount_gnf     NUMERIC     NOT NULL CHECK (amount_gnf >= 0),
  commission_gnf NUMERIC     NOT NULL DEFAULT 0 CHECK (commission_gnf = 0),
  net_gnf        NUMERIC     NOT NULL CHECK (net_gnf >= 0),
  license_type   TEXT        NOT NULL CHECK (license_type IN ('non_exclusive', 'exclusive', 'free')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT beat_purchases_unique_per_buyer UNIQUE (buyer_id, beat_id)
);

CREATE INDEX IF NOT EXISTS idx_beat_purchases_buyer
  ON public.beat_purchases(buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_beat_purchases_beat
  ON public.beat_purchases(beat_id, created_at DESC);

ALTER TABLE public.beat_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beat_purchases_select_buyer"   ON public.beat_purchases;
DROP POLICY IF EXISTS "beat_purchases_select_creator" ON public.beat_purchases;
DROP POLICY IF EXISTS "beat_purchases_admin_all"      ON public.beat_purchases;

CREATE POLICY "beat_purchases_select_buyer" ON public.beat_purchases
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "beat_purchases_select_creator" ON public.beat_purchases
  FOR SELECT TO authenticated
  USING (
    creator_id IN (
      SELECT id FROM public.creators WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "beat_purchases_admin_all" ON public.beat_purchases
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT interdit directement (Zero Trust) - passe par RPC purchase_beat uniquement

-- ---------------------------------------------------------------------------
-- RPC : purchase_beat
-- CDC Regle #4 : commission = 0 GNF sur les beats
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purchase_beat(
  p_buyer_id UUID,
  p_beat_id  UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_beat           public.beats%ROWTYPE;
  v_buyer_wallet   public.wallets%ROWTYPE;
  v_creator_owner  UUID;
  v_creator_wallet public.wallets%ROWTYPE;
  v_purchase_id    UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_buyer_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT * INTO v_beat
  FROM public.beats
  WHERE id = p_beat_id
    AND publication_status = 'published'
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'beat_not_found';
  END IF;

  SELECT owner_id INTO v_creator_owner
  FROM public.creators
  WHERE id = v_beat.creator_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'beat_not_found';
  END IF;

  IF auth.uid() = v_creator_owner THEN
    RAISE EXCEPTION 'cannot_buy_own_beat';
  END IF;

  SELECT * INTO v_buyer_wallet
  FROM public.wallets
  WHERE user_id = p_buyer_id
  FOR UPDATE;

  IF NOT FOUND OR v_buyer_wallet.balance_gnf < v_beat.price_gnf THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  SELECT * INTO v_creator_wallet
  FROM public.wallets
  WHERE user_id = v_creator_owner
  FOR UPDATE;

  UPDATE public.wallets
  SET balance_gnf = balance_gnf - v_beat.price_gnf,
      updated_at  = now()
  WHERE user_id = p_buyer_id;

  UPDATE public.wallets
  SET balance_gnf = balance_gnf + v_beat.price_gnf,
      updated_at  = now()
  WHERE user_id = v_creator_owner;

  INSERT INTO public.beat_purchases (
    buyer_id, beat_id, creator_id,
    amount_gnf, commission_gnf, net_gnf, license_type
  ) VALUES (
    p_buyer_id, p_beat_id, v_beat.creator_id,
    v_beat.price_gnf, 0, v_beat.price_gnf, v_beat.license_type
  )
  RETURNING id INTO v_purchase_id;

  INSERT INTO public.transactions (
    user_id, wallet_id, type, status,
    amount_gnf, commission_gnf, net_amount_gnf,
    currency, payment_method, description, metadata, processed_at
  ) VALUES (
    p_buyer_id, v_buyer_wallet.id, 'beat_purchase', 'completed',
    v_beat.price_gnf, 0, v_beat.price_gnf,
    'GNF', 'internal',
    'Achat beat : ' || v_beat.title,
    jsonb_build_object('beat_id', p_beat_id, 'purchase_id', v_purchase_id),
    now()
  );

  INSERT INTO public.transactions (
    user_id, wallet_id, type, status,
    amount_gnf, commission_gnf, net_amount_gnf,
    currency, payment_method, description, metadata, processed_at
  ) VALUES (
    v_creator_owner, v_creator_wallet.id, 'beat_sale', 'completed',
    v_beat.price_gnf, 0, v_beat.price_gnf,
    'GNF', 'internal',
    'Vente beat : ' || v_beat.title,
    jsonb_build_object('beat_id', p_beat_id, 'buyer_id', p_buyer_id, 'purchase_id', v_purchase_id),
    now()
  );

  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf, reason, metadata
  ) VALUES (
    v_buyer_wallet.id, p_buyer_id, 'debit', v_beat.price_gnf,
    v_buyer_wallet.balance_gnf - v_beat.price_gnf,
    'beat_purchase',
    jsonb_build_object('beat_id', p_beat_id, 'purchase_id', v_purchase_id)
  );

  INSERT INTO public.wallet_ledger (
    wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf, reason, metadata
  ) VALUES (
    v_creator_wallet.id, v_creator_owner, 'credit', v_beat.price_gnf,
    v_creator_wallet.balance_gnf + v_beat.price_gnf,
    'beat_sale',
    jsonb_build_object('beat_id', p_beat_id, 'buyer_id', p_buyer_id, 'purchase_id', v_purchase_id)
  );

  PERFORM public.log_audit_event_authenticated(
    'beat.purchased',
    'beat_purchase',
    v_purchase_id,
    jsonb_build_object('beat_id', p_beat_id, 'amount_gnf', v_beat.price_gnf)
  );

  RETURN v_purchase_id;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_beat(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_beat(UUID, UUID) TO authenticated;
