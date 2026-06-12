-- Sprint 8.0 — Royalty Engine Enterprise
-- RPCs: open_royalty_cycle · calculate_royalties · distribute_royalties
--       get_royalty_cycle_summary · get_creator_royalty_history · get_active_royalty_cycle
--
-- Modèle financier :
--   total_revenue_gnf → revenue_pool_gnf (65% par défaut) → part artiste
--   part_artiste = (valid_listens_artiste / valid_listens_global) × revenue_pool_gnf
--   La plateforme conserve les 35% restants avant constitution du pool.
--   platform_commission_gnf dans royalty_calculations = 0 (déjà pris au niveau du pool).
--
-- Sécurité :
--   RPCs admin    → _assert_admin()            (vérifie user_roles 'admin')
--   RPCs créateur → _assert_creator_owner()    (vérifie creators.owner_id = auth.uid())
--
-- Idempotence :
--   calculate_royalties  → ON CONFLICT (cycle_id, artist_id) DO UPDATE
--   distribute_royalties → skip WHERE status = 'paid'
--
-- Audit financier :
--   wallet_ledger = INSERT ONLY (trigger existant)
--   transactions  = historique complet

-- ─────────────────────────────────────────────────────────────────────────────
-- Index pour les calculs de royalties (agrégation par période + stream validés)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_stream_sessions_royalty_period
  ON public.stream_sessions(started_at, track_id)
  WHERE is_valid_listen = true;

CREATE INDEX IF NOT EXISTS idx_royalty_calculations_cycle_status
  ON public.royalty_calculations(cycle_id, status);

CREATE INDEX IF NOT EXISTS idx_royalty_calculations_artist_status
  ON public.royalty_calculations(artist_id, status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper admin : vérifie que auth.uid() est administrateur
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._assert_admin()
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public._assert_admin FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._assert_admin TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. open_royalty_cycle — Admin
-- Ouvre un nouveau cycle de royalties pour une période donnée.
-- Vérifie l'absence de chevauchement avec un cycle actif.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.open_royalty_cycle(
  p_period_start          DATE,
  p_period_end            DATE,
  p_total_revenue_gnf     NUMERIC,
  p_revenue_pool_percent  NUMERIC DEFAULT 65.00
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_id UUID;
  v_pool_gnf NUMERIC;
BEGIN
  PERFORM public._assert_admin();

  IF p_period_start >= p_period_end THEN
    RAISE EXCEPTION 'period_start doit être antérieur à period_end.';
  END IF;

  IF p_total_revenue_gnf <= 0 THEN
    RAISE EXCEPTION 'total_revenue_gnf doit être positif.';
  END IF;

  IF p_revenue_pool_percent <= 0 OR p_revenue_pool_percent > 100 THEN
    RAISE EXCEPTION 'revenue_pool_percent doit être entre 0 et 100.';
  END IF;

  -- Aucun chevauchement avec un cycle non clôturé
  IF EXISTS (
    SELECT 1 FROM public.royalty_cycles
    WHERE status NOT IN ('closed')
      AND period_start <= p_period_end
      AND period_end   >= p_period_start
  ) THEN
    RAISE EXCEPTION 'Un cycle actif chevauche déjà cette période.';
  END IF;

  v_pool_gnf := ROUND(p_total_revenue_gnf * p_revenue_pool_percent / 100.0, 2);

  INSERT INTO public.royalty_cycles (
    period_start, period_end, status,
    total_revenue_gnf, revenue_pool_gnf, revenue_pool_percent
  ) VALUES (
    p_period_start, p_period_end, 'open',
    ROUND(p_total_revenue_gnf, 2), v_pool_gnf, p_revenue_pool_percent
  )
  RETURNING id INTO v_cycle_id;

  RETURN v_cycle_id;
END;
$$;

REVOKE ALL ON FUNCTION public.open_royalty_cycle FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_royalty_cycle TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. calculate_royalties — Admin
-- Agrège les écoutes valides sur la période du cycle et calcule les parts.
-- IDEMPOTENTE : ON CONFLICT DO UPDATE — sûr à relancer.
-- Transitions : open → calculating → ready
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calculate_royalties(
  p_cycle_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle          public.royalty_cycles%ROWTYPE;
  v_total_listens  BIGINT  := 0;
  v_artist_count   INTEGER := 0;
  v_total_net      NUMERIC := 0;
BEGIN
  PERFORM public._assert_admin();

  -- Verrou exclusif pour empêcher les calculs concurrents sur ce cycle
  SELECT * INTO v_cycle
  FROM public.royalty_cycles
  WHERE id = p_cycle_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle introuvable : %', p_cycle_id;
  END IF;

  IF v_cycle.status NOT IN ('open', 'calculating') THEN
    RAISE EXCEPTION 'Impossible de calculer un cycle en statut %. Statut requis : open ou calculating.',
      v_cycle.status;
  END IF;

  -- Transition : open → calculating
  UPDATE public.royalty_cycles SET status = 'calculating' WHERE id = p_cycle_id;

  -- ── Total des écoutes valides sur la période ──────────────────────────────
  SELECT COUNT(*)::BIGINT INTO v_total_listens
  FROM public.stream_sessions ss
  JOIN public.tracks t ON ss.track_id = t.id
  WHERE ss.is_valid_listen = true
    AND ss.started_at::DATE BETWEEN v_cycle.period_start AND v_cycle.period_end
    AND t.deleted_at IS NULL;

  -- Cycle vide : aucune écoute
  IF v_total_listens = 0 THEN
    UPDATE public.royalty_cycles
    SET status = 'ready', total_valid_listens = 0, artist_count = 0
    WHERE id = p_cycle_id;

    RETURN jsonb_build_object(
      'cycle_id',            p_cycle_id,
      'total_valid_listens', 0,
      'artist_count',        0,
      'revenue_pool_gnf',    v_cycle.revenue_pool_gnf,
      'total_net_gnf',       0,
      'status',              'ready'
    );
  END IF;

  -- ── Calcul des parts par artiste ──────────────────────────────────────────
  -- Groupe par owner_id (artist_id) pour respecter UNIQUE(cycle_id, artist_id).
  -- Un artiste peut avoir plusieurs creators ; on prend le premier (MIN) comme référence.
  WITH artist_listens AS (
    SELECT
      c.owner_id   AS artist_id,
      MIN(c.id)    AS creator_id,
      COUNT(ss.id) AS listen_count
    FROM public.stream_sessions ss
    JOIN public.tracks   t ON ss.track_id  = t.id
    JOIN public.creators c ON t.creator_id = c.id
    WHERE ss.is_valid_listen = true
      AND ss.started_at::DATE BETWEEN v_cycle.period_start AND v_cycle.period_end
      AND t.deleted_at IS NULL
    GROUP BY c.owner_id
  )
  INSERT INTO public.royalty_calculations (
    cycle_id, artist_id, creator_id,
    valid_listen_count,
    listen_share_percent,
    gross_amount_gnf,
    platform_commission_gnf,
    net_amount_gnf,
    status
  )
  SELECT
    p_cycle_id,
    al.artist_id,
    al.creator_id,
    al.listen_count,
    ROUND((al.listen_count::NUMERIC / v_total_listens * 100.0), 6),
    ROUND((al.listen_count::NUMERIC / v_total_listens * v_cycle.revenue_pool_gnf), 2),
    0,  -- commission = 0 ; la plateforme prend 35% au niveau du pool global
    ROUND((al.listen_count::NUMERIC / v_total_listens * v_cycle.revenue_pool_gnf), 2),
    'pending'
  FROM artist_listens al
  ON CONFLICT (cycle_id, artist_id) DO UPDATE SET
    creator_id              = EXCLUDED.creator_id,
    valid_listen_count      = EXCLUDED.valid_listen_count,
    listen_share_percent    = EXCLUDED.listen_share_percent,
    gross_amount_gnf        = EXCLUDED.gross_amount_gnf,
    platform_commission_gnf = EXCLUDED.platform_commission_gnf,
    net_amount_gnf          = EXCLUDED.net_amount_gnf,
    -- Remettre en pending seulement si pas encore payé (idempotence safe)
    status = CASE
      WHEN royalty_calculations.status = 'paid' THEN 'paid'
      ELSE 'pending'
    END,
    updated_at = now();

  -- Métriques finales
  SELECT COUNT(*), COALESCE(SUM(net_amount_gnf), 0)
  INTO v_artist_count, v_total_net
  FROM public.royalty_calculations
  WHERE cycle_id = p_cycle_id
    AND status   != 'cancelled';

  -- Transition : calculating → ready
  UPDATE public.royalty_cycles
  SET status              = 'ready',
      total_valid_listens = v_total_listens,
      artist_count        = v_artist_count
  WHERE id = p_cycle_id;

  RETURN jsonb_build_object(
    'cycle_id',            p_cycle_id,
    'total_valid_listens', v_total_listens,
    'artist_count',        v_artist_count,
    'revenue_pool_gnf',    v_cycle.revenue_pool_gnf,
    'total_net_gnf',       v_total_net,
    'status',              'ready'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_royalties FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_royalties TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. distribute_royalties — Admin
-- Crédite le wallet de chaque artiste. IDEMPOTENTE.
-- Saute les calculs déjà 'paid'. Transitions : ready → distributed.
-- Double comptabilisation impossible : UNIQUE(cycle_id, artist_id) + status check.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.distribute_royalties(
  p_cycle_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle       public.royalty_cycles%ROWTYPE;
  v_calc        RECORD;
  v_wallet      public.wallets%ROWTYPE;
  v_distributed INTEGER := 0;
  v_total_gnf   NUMERIC := 0;
BEGIN
  PERFORM public._assert_admin();

  SELECT * INTO v_cycle
  FROM public.royalty_cycles
  WHERE id = p_cycle_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle introuvable : %', p_cycle_id;
  END IF;

  IF v_cycle.status NOT IN ('ready', 'distributed') THEN
    RAISE EXCEPTION 'Le cycle doit être en statut ready ou distributed (actuel : %).', v_cycle.status;
  END IF;

  -- Traiter chaque calcul non encore payé
  FOR v_calc IN
    SELECT rc.*
    FROM public.royalty_calculations rc
    WHERE rc.cycle_id      = p_cycle_id
      AND rc.status        IN ('pending', 'approved')
      AND rc.net_amount_gnf > 0
    ORDER BY rc.net_amount_gnf DESC
    FOR UPDATE OF rc
  LOOP
    -- Verrouiller le wallet de l'artiste (prévention race condition)
    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE user_id = v_calc.artist_id
    FOR UPDATE;

    IF NOT FOUND THEN
      -- Wallet absent : cas exceptionnel — passer au suivant
      CONTINUE;
    END IF;

    -- ── Crédit wallet ────────────────────────────────────────────────────────
    UPDATE public.wallets
    SET balance_gnf        = balance_gnf        + v_calc.net_amount_gnf,
        total_credited_gnf = total_credited_gnf + v_calc.net_amount_gnf
    WHERE user_id = v_calc.artist_id;

    -- ── Ledger immuable (INSERT ONLY) ─────────────────────────────────────────
    INSERT INTO public.wallet_ledger (
      wallet_id, user_id, entry_type,
      amount_gnf, balance_after_gnf,
      reason, reference_id, reference_type, metadata
    ) VALUES (
      v_wallet.id,
      v_calc.artist_id,
      'credit',
      v_calc.net_amount_gnf,
      v_wallet.balance_gnf + v_calc.net_amount_gnf,
      'royalty',
      v_calc.id,
      'royalty_calculation',
      jsonb_build_object(
        'cycle_id',             p_cycle_id,
        'period_start',         v_cycle.period_start::TEXT,
        'period_end',           v_cycle.period_end::TEXT,
        'valid_listen_count',   v_calc.valid_listen_count,
        'listen_share_percent', v_calc.listen_share_percent,
        'creator_id',           v_calc.creator_id
      )
    );

    -- ── Transaction (historique utilisateur) ─────────────────────────────────
    INSERT INTO public.transactions (
      user_id, wallet_id, type, status,
      amount_gnf, commission_gnf, net_amount_gnf,
      payment_method, description, processed_at
    ) VALUES (
      v_calc.artist_id,
      v_wallet.id,
      'royalty_payout',
      'completed',
      v_calc.net_amount_gnf,
      v_calc.platform_commission_gnf,
      v_calc.net_amount_gnf,
      'internal',
      format(
        'Royalties %s – %s · %s écoutes valides · %.4f%%',
        to_char(v_cycle.period_start, 'DD/MM/YYYY'),
        to_char(v_cycle.period_end,   'DD/MM/YYYY'),
        v_calc.valid_listen_count,
        v_calc.listen_share_percent
      ),
      now()
    );

    -- ── Marquer le calcul comme payé ─────────────────────────────────────────
    UPDATE public.royalty_calculations
    SET status  = 'paid',
        paid_at = now()
    WHERE id = v_calc.id;

    v_distributed := v_distributed + 1;
    v_total_gnf   := v_total_gnf + v_calc.net_amount_gnf;
  END LOOP;

  -- Marquer le cycle comme distribué (idempotent : COALESCE preserve la première date)
  UPDATE public.royalty_cycles
  SET status         = 'distributed',
      distributed_at = COALESCE(distributed_at, now())
  WHERE id = p_cycle_id;

  RETURN jsonb_build_object(
    'cycle_id',          p_cycle_id,
    'distributed_count', v_distributed,
    'total_gnf',         v_total_gnf,
    'status',            'distributed'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.distribute_royalties FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.distribute_royalties TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. get_royalty_cycle_summary — Admin
-- Retourne le détail complet d'un cycle avec toutes ses calculations.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_royalty_cycle_summary(
  p_cycle_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  PERFORM public._assert_admin();

  SELECT jsonb_build_object(
    'id',                   rc.id,
    'period_start',         rc.period_start::TEXT,
    'period_end',           rc.period_end::TEXT,
    'status',               rc.status,
    'total_revenue_gnf',    rc.total_revenue_gnf,
    'revenue_pool_gnf',     rc.revenue_pool_gnf,
    'revenue_pool_percent', rc.revenue_pool_percent,
    'total_valid_listens',  rc.total_valid_listens,
    'artist_count',         rc.artist_count,
    'distributed_at',       rc.distributed_at::TEXT,
    'calculations', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'calculation_id',       calc.id,
          'artist_id',            calc.artist_id,
          'creator_id',           calc.creator_id,
          'valid_listen_count',   calc.valid_listen_count,
          'listen_share_percent', calc.listen_share_percent,
          'net_amount_gnf',       calc.net_amount_gnf,
          'status',               calc.status,
          'paid_at',              calc.paid_at::TEXT
        )
        ORDER BY calc.net_amount_gnf DESC
      ), '[]'::JSONB)
      FROM public.royalty_calculations calc
      WHERE calc.cycle_id = rc.id
    )
  ) INTO v_result
  FROM public.royalty_cycles rc
  WHERE rc.id = p_cycle_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_royalty_cycle_summary FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_royalty_cycle_summary TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. get_creator_royalty_history — Créateur
-- Historique des royalties pour un créateur (sécurisé par _assert_creator_owner).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_creator_royalty_history(
  p_creator_id UUID,
  p_limit      INTEGER DEFAULT 12
)
RETURNS JSONB
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  PERFORM public._assert_creator_owner(p_creator_id);

  WITH history AS (
    SELECT
      rc.id                    AS calculation_id,
      rc.cycle_id,
      rc.valid_listen_count,
      rc.listen_share_percent,
      rc.net_amount_gnf,
      rc.status                AS calc_status,
      rc.paid_at,
      cy.period_start          AS cycle_start,
      cy.period_end            AS cycle_end,
      cy.status                AS cycle_status,
      cy.revenue_pool_gnf,
      cy.total_valid_listens
    FROM public.royalty_calculations rc
    JOIN public.royalty_cycles cy ON cy.id = rc.cycle_id
    JOIN public.creators c        ON c.id  = p_creator_id
    WHERE rc.artist_id = c.owner_id
    ORDER BY cy.period_start DESC
    LIMIT p_limit
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'calculation_id',       h.calculation_id,
      'cycle_id',             h.cycle_id,
      'cycle_start',          h.cycle_start::TEXT,
      'cycle_end',            h.cycle_end::TEXT,
      'cycle_status',         h.cycle_status,
      'calc_status',          h.calc_status,
      'valid_listen_count',   h.valid_listen_count,
      'listen_share_percent', h.listen_share_percent,
      'net_amount_gnf',       h.net_amount_gnf,
      'paid_at',              h.paid_at::TEXT,
      'revenue_pool_gnf',     h.revenue_pool_gnf,
      'total_valid_listens',  h.total_valid_listens
    )
    ORDER BY h.cycle_start DESC
  ), '[]'::JSONB) INTO v_result
  FROM history h;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

REVOKE ALL ON FUNCTION public.get_creator_royalty_history FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_royalty_history TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. get_active_royalty_cycle — Authentifié + Anonyme
-- Retourne le cycle le plus récent non clôturé (info publique du pool).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_active_royalty_cycle()
RETURNS JSONB
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id',                   rc.id,
    'period_start',         rc.period_start::TEXT,
    'period_end',           rc.period_end::TEXT,
    'status',               rc.status,
    'revenue_pool_percent', rc.revenue_pool_percent,
    'total_valid_listens',  rc.total_valid_listens,
    'artist_count',         rc.artist_count,
    'distributed_at',       rc.distributed_at::TEXT
  ) INTO v_result
  FROM public.royalty_cycles rc
  WHERE rc.status != 'closed'
  ORDER BY rc.period_start DESC
  LIMIT 1;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_active_royalty_cycle FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_royalty_cycle TO authenticated, anon;
