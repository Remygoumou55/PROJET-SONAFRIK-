-- Sprint Admin 5 — Awards programme + Beat Store modération admin

BEGIN;

-- ── Awards : éditions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.award_editions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  year                 INTEGER     NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  status               TEXT        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'votes_closed', 'completed')),
  votes_open_at        TIMESTAMPTZ,
  votes_close_at       TIMESTAMPTZ,
  votes_closed_at      TIMESTAMPTZ,
  ceremony_date        TIMESTAMPTZ,
  prizes_distributed_at TIMESTAMPTZ,
  score_streams_weight NUMERIC     NOT NULL DEFAULT 70 CHECK (score_streams_weight BETWEEN 0 AND 100),
  score_votes_weight   NUMERIC     NOT NULL DEFAULT 30 CHECK (score_votes_weight BETWEEN 0 AND 100),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT award_editions_score_weights_sum CHECK (
    score_streams_weight + score_votes_weight = 100
  )
);

CREATE INDEX IF NOT EXISTS idx_award_editions_status
  ON public.award_editions(status, year DESC);

-- ── Awards : catégories ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.award_categories (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id       UUID        NOT NULL REFERENCES public.award_editions(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  prize_amount_gnf NUMERIC     NOT NULL DEFAULT 0 CHECK (prize_amount_gnf >= 0),
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT award_categories_edition_name_unique UNIQUE (edition_id, name)
);

CREATE INDEX IF NOT EXISTS idx_award_categories_edition
  ON public.award_categories(edition_id, sort_order);

-- ── Awards : nominés ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.award_nominees (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id       UUID        NOT NULL REFERENCES public.award_editions(id) ON DELETE CASCADE,
  category_id      UUID        NOT NULL REFERENCES public.award_categories(id) ON DELETE CASCADE,
  creator_id       UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  vote_count       INTEGER     NOT NULL DEFAULT 0 CHECK (vote_count >= 0),
  score_calculated NUMERIC,
  rank_position    INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT award_nominees_unique UNIQUE (edition_id, category_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_award_nominees_category_votes
  ON public.award_nominees(category_id, vote_count DESC);

CREATE INDEX IF NOT EXISTS idx_award_nominees_edition
  ON public.award_nominees(edition_id);

-- ── Awards : fonds ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.award_fund_ledger (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id  UUID        REFERENCES public.award_editions(id) ON DELETE SET NULL,
  amount_gnf  NUMERIC     NOT NULL CHECK (amount_gnf > 0),
  direction   TEXT        NOT NULL CHECK (direction IN ('credit', 'debit')),
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_award_fund_ledger_created
  ON public.award_fund_ledger(created_at DESC);

-- ── RLS Awards ──────────────────────────────────────────────────────────────
ALTER TABLE public.award_editions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_nominees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_fund_ledger  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS award_editions_admin_all ON public.award_editions;
CREATE POLICY award_editions_admin_all ON public.award_editions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS award_categories_admin_all ON public.award_categories;
CREATE POLICY award_categories_admin_all ON public.award_categories
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS award_nominees_admin_all ON public.award_nominees;
CREATE POLICY award_nominees_admin_all ON public.award_nominees
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS award_fund_ledger_admin_all ON public.award_fund_ledger;
CREATE POLICY award_fund_ledger_admin_all ON public.award_fund_ledger
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Realtime : votes nominés
ALTER PUBLICATION supabase_realtime ADD TABLE public.award_nominees;

DROP TRIGGER IF EXISTS set_updated_at_award_editions ON public.award_editions;
CREATE TRIGGER set_updated_at_award_editions
  BEFORE UPDATE ON public.award_editions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_award_nominees ON public.award_nominees;
CREATE TRIGGER set_updated_at_award_nominees
  BEFORE UPDATE ON public.award_nominees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Beat Store : colonnes modération ────────────────────────────────────────
ALTER TABLE public.beats
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- ── RPC : Approuver un beat ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_approve_beat(p_beat_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  UPDATE public.beats
  SET publication_status = 'published',
      published_at = now(),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      rejection_reason = NULL,
      updated_at = now()
  WHERE id = p_beat_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Beat introuvable';
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'admin.beat_approved',
    'beats',
    p_beat_id,
    '{}'::jsonb
  );
END;
$$;

-- ── RPC : Refuser un beat ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_reject_beat(p_beat_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  IF trim(COALESCE(p_reason, '')) = '' THEN
    RAISE EXCEPTION 'Motif obligatoire';
  END IF;

  UPDATE public.beats
  SET publication_status = 'archived',
      rejection_reason = trim(p_reason),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_beat_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Beat introuvable';
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'admin.beat_rejected',
    'beats',
    p_beat_id,
    jsonb_build_object('reason', trim(p_reason))
  );
END;
$$;

-- ── RPC : Supprimer un beat (soft delete) ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_delete_beat(p_beat_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  UPDATE public.beats
  SET deleted_at = now(),
      updated_at = now()
  WHERE id = p_beat_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Beat introuvable';
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'admin.beat_deleted',
    'beats',
    p_beat_id,
    '{}'::jsonb
  );
END;
$$;

-- ── RPC : Fermer les votes Awards ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_close_award_votes(p_edition_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  UPDATE public.award_editions
  SET status = 'votes_closed',
      votes_closed_at = now(),
      updated_at = now()
  WHERE id = p_edition_id
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Édition introuvable ou votes déjà fermés';
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'admin.award_votes_closed',
    'award_edition',
    p_edition_id,
    '{}'::jsonb
  );
END;
$$;

-- ── RPC : Distribuer les prix Awards ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_distribute_awards_prizes(
  p_edition_id UUID,
  p_admin_note TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nominee   RECORD;
  v_owner_id  UUID;
  v_wallet    public.wallets%ROWTYPE;
  v_new_bal   NUMERIC;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.award_editions
    WHERE id = p_edition_id AND status = 'votes_closed'
  ) THEN
    RAISE EXCEPTION 'Les votes doivent être fermés avant le versement des prix';
  END IF;

  FOR v_nominee IN
    SELECT an.creator_id, ac.prize_amount_gnf, ac.name AS category_name, an.id AS nominee_id
    FROM public.award_nominees an
    JOIN public.award_categories ac ON ac.id = an.category_id
    WHERE an.edition_id = p_edition_id
      AND an.rank_position = 1
      AND ac.prize_amount_gnf > 0
  LOOP
    SELECT owner_id INTO v_owner_id
    FROM public.creators
    WHERE id = v_nominee.creator_id AND deleted_at IS NULL;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE user_id = v_owner_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Wallet introuvable pour le gagnant';
    END IF;

    v_new_bal := v_wallet.balance_gnf + v_nominee.prize_amount_gnf;

    UPDATE public.wallets
    SET balance_gnf = v_new_bal,
        updated_at = now()
    WHERE id = v_wallet.id;

    INSERT INTO public.wallet_ledger (
      wallet_id, user_id, entry_type, amount_gnf, balance_after_gnf,
      reason, reference_type, reference_id, metadata
    ) VALUES (
      v_wallet.id, v_owner_id, 'credit', v_nominee.prize_amount_gnf, v_new_bal,
      'award_prize',
      'award_nominee', v_nominee.nominee_id,
      jsonb_build_object(
        'edition_id', p_edition_id,
        'category', v_nominee.category_name,
        'note', COALESCE(p_admin_note, '')
      )
    );

    INSERT INTO public.award_fund_ledger (edition_id, amount_gnf, direction, source)
    VALUES (
      p_edition_id,
      v_nominee.prize_amount_gnf,
      'debit',
      'Prix — ' || v_nominee.category_name
    );
  END LOOP;

  UPDATE public.award_editions
  SET status = 'completed',
      prizes_distributed_at = now(),
      updated_at = now()
  WHERE id = p_edition_id;

  PERFORM public.log_audit_event_authenticated(
    'admin.awards_prizes_distributed',
    'award_edition',
    p_edition_id,
    jsonb_build_object('note', COALESCE(p_admin_note, ''))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_beat(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reject_beat(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_beat(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_close_award_votes(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_distribute_awards_prizes(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_approve_beat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_beat(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_beat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_close_award_votes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_distribute_awards_prizes(UUID, TEXT) TO authenticated;

COMMIT;
