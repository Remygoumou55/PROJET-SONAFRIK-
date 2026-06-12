-- Sprint 7.0 — Creator Analytics Pro
-- RPCs: stream stats · timeline · top tracks · top albums · audience · revenue
-- Sécurité : chaque RPC vérifie que auth.uid() est l'owner du creator_id passé.
-- Géographie : données non disponibles dans stream_sessions — non implémentée.

-- ─────────────────────────────────────────────────────────────────────────────
-- Index analytiques
-- ─────────────────────────────────────────────────────────────────────────────

-- Covering index pour les agrégations analytiques sur stream_sessions :
-- évite le heap lookup pour is_valid_listen et fraud_flags.
CREATE INDEX IF NOT EXISTS idx_stream_sessions_creator_analytics
  ON public.stream_sessions(track_id, started_at DESC)
  INCLUDE (is_valid_listen, fraud_flags);

-- Index pour la croissance des followers dans le temps.
CREATE INDEX IF NOT EXISTS idx_follows_entity_time
  ON public.follows(entity_type, entity_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper interne : vérifier que auth.uid() est owner du creator
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._assert_creator_owner(p_creator_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.creators
    WHERE id = p_creator_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public._assert_creator_owner FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._assert_creator_owner TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. get_creator_stream_stats
-- Retourne : total, validés, fraude + fenêtres aujourd'hui/7j/30j/90j
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_creator_stream_stats(
  p_creator_id UUID
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

  WITH creator_tracks AS (
    SELECT id FROM public.tracks
    WHERE creator_id = p_creator_id AND deleted_at IS NULL
  ),
  stats AS (
    SELECT
      COUNT(*)                                                              AS total_streams,
      COUNT(*) FILTER (WHERE ss.is_valid_listen = true)                    AS valid_streams,
      COUNT(*) FILTER (WHERE ss.fraud_flags != '{}')                       AS fraud_streams,
      COUNT(*) FILTER (WHERE ss.started_at >= CURRENT_DATE)                AS today_streams,
      COUNT(*) FILTER (WHERE ss.started_at >= now() - INTERVAL '7 days')   AS week_streams,
      COUNT(*) FILTER (WHERE ss.started_at >= now() - INTERVAL '30 days')  AS month_streams,
      COUNT(*) FILTER (WHERE ss.started_at >= now() - INTERVAL '90 days')  AS quarter_streams,
      COUNT(*) FILTER (
        WHERE ss.is_valid_listen = true
          AND ss.started_at >= now() - INTERVAL '7 days'
      )                                                                     AS valid_week_streams,
      COUNT(*) FILTER (
        WHERE ss.is_valid_listen = true
          AND ss.started_at >= now() - INTERVAL '30 days'
      )                                                                     AS valid_month_streams
    FROM public.stream_sessions ss
    JOIN creator_tracks ct ON ss.track_id = ct.id
  )
  SELECT jsonb_build_object(
    'total_streams',         COALESCE(s.total_streams, 0),
    'valid_streams',         COALESCE(s.valid_streams, 0),
    'fraud_streams',         COALESCE(s.fraud_streams, 0),
    'today_streams',         COALESCE(s.today_streams, 0),
    'week_streams',          COALESCE(s.week_streams, 0),
    'month_streams',         COALESCE(s.month_streams, 0),
    'quarter_streams',       COALESCE(s.quarter_streams, 0),
    'valid_week_streams',    COALESCE(s.valid_week_streams, 0),
    'valid_month_streams',   COALESCE(s.valid_month_streams, 0),
    'valid_rate_percent',    CASE
      WHEN COALESCE(s.total_streams, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(s.valid_streams, 0)::NUMERIC / s.total_streams * 100), 1)
    END
  ) INTO v_result
  FROM stats s;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;

REVOKE ALL ON FUNCTION public.get_creator_stream_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_stream_stats TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. get_creator_stream_timeline
-- Retourne : tableau [{date, streams, valid_streams}] sur p_days jours
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_creator_stream_timeline(
  p_creator_id UUID,
  p_days       INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_days   INTEGER := LEAST(GREATEST(COALESCE(p_days, 30), 7), 90);
BEGIN
  PERFORM public._assert_creator_owner(p_creator_id);

  WITH creator_tracks AS (
    SELECT id FROM public.tracks
    WHERE creator_id = p_creator_id AND deleted_at IS NULL
  ),
  date_series AS (
    SELECT generate_series(
      CURRENT_DATE - (v_days - 1),
      CURRENT_DATE,
      INTERVAL '1 day'
    )::DATE AS day
  ),
  daily AS (
    SELECT
      ss.started_at::DATE                                    AS day,
      COUNT(*)                                               AS streams,
      COUNT(*) FILTER (WHERE ss.is_valid_listen = true)      AS valid_streams
    FROM public.stream_sessions ss
    JOIN creator_tracks ct ON ss.track_id = ct.id
    WHERE ss.started_at >= CURRENT_DATE - v_days
    GROUP BY ss.started_at::DATE
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date',          ds.day::TEXT,
      'streams',       COALESCE(d.streams, 0),
      'valid_streams', COALESCE(d.valid_streams, 0)
    )
    ORDER BY ds.day
  ) INTO v_result
  FROM date_series ds
  LEFT JOIN daily d ON d.day = ds.day;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

REVOKE ALL ON FUNCTION public.get_creator_stream_timeline FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_stream_timeline TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. get_creator_top_tracks
-- Retourne : top p_limit tracks classés par engagement (valid_streams + likes)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_creator_top_tracks(
  p_creator_id UUID,
  p_limit      INTEGER DEFAULT 10
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

  WITH track_streams AS (
    SELECT
      ss.track_id,
      COUNT(*)                                               AS total_streams,
      COUNT(*) FILTER (WHERE ss.is_valid_listen = true)      AS valid_streams
    FROM public.stream_sessions ss
    JOIN public.tracks t ON ss.track_id = t.id
    WHERE t.creator_id = p_creator_id AND t.deleted_at IS NULL
    GROUP BY ss.track_id
  ),
  track_likes AS (
    SELECT f.entity_id AS track_id, COUNT(*) AS like_count
    FROM public.favorites f
    JOIN public.tracks t ON f.entity_id = t.id
    WHERE f.entity_type = 'track'
      AND t.creator_id  = p_creator_id
      AND t.deleted_at  IS NULL
    GROUP BY f.entity_id
  ),
  ranked AS (
    SELECT
      t.id               AS track_id,
      t.title,
      t.slug,
      t.album_id,
      a.title            AS album_title,
      a.cover_path,
      t.duration_seconds,
      COALESCE(ts.valid_streams, 0)  AS valid_streams,
      COALESCE(ts.total_streams, 0)  AS total_streams,
      COALESCE(tl.like_count, 0)     AS like_count,
      ROUND(
        (COALESCE(tl.like_count, 0) * 0.4
         + COALESCE(ts.valid_streams, 0) * 0.05)::NUMERIC, 2
      )                  AS engagement_score,
      -- score de classement composite
      (COALESCE(ts.valid_streams, 0) * 0.6
       + COALESCE(tl.like_count, 0) * 0.4) AS rank_score
    FROM public.tracks t
    LEFT JOIN public.albums a   ON t.album_id = a.id AND a.deleted_at IS NULL
    LEFT JOIN track_streams ts  ON ts.track_id = t.id
    LEFT JOIN track_likes tl    ON tl.track_id = t.id
    WHERE t.creator_id         = p_creator_id
      AND t.publication_status = 'published'
      AND t.deleted_at         IS NULL
    ORDER BY rank_score DESC
    LIMIT p_limit
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'track_id',        r.track_id,
      'title',           r.title,
      'slug',            r.slug,
      'album_id',        r.album_id,
      'album_title',     r.album_title,
      'cover_path',      r.cover_path,
      'duration_seconds',r.duration_seconds,
      'valid_streams',   r.valid_streams,
      'total_streams',   r.total_streams,
      'like_count',      r.like_count,
      'engagement_score',r.engagement_score
    )
    ORDER BY r.rank_score DESC
  ) INTO v_result
  FROM ranked r;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

REVOKE ALL ON FUNCTION public.get_creator_top_tracks FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_top_tracks TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. get_creator_top_albums
-- Retourne : top p_limit albums (streams cumulés de tous leurs tracks)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_creator_top_albums(
  p_creator_id UUID,
  p_limit      INTEGER DEFAULT 10
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

  WITH album_track_ids AS (
    SELECT id AS track_id, album_id
    FROM public.tracks
    WHERE creator_id = p_creator_id
      AND album_id   IS NOT NULL
      AND deleted_at IS NULL
  ),
  album_streams AS (
    SELECT
      at.album_id,
      COUNT(ss.id)                                            AS total_streams,
      COUNT(ss.id) FILTER (WHERE ss.is_valid_listen = true)   AS valid_streams
    FROM public.stream_sessions ss
    JOIN album_track_ids at ON ss.track_id = at.track_id
    GROUP BY at.album_id
  ),
  album_likes AS (
    SELECT entity_id AS album_id, COUNT(*) AS like_count
    FROM public.favorites
    WHERE entity_type = 'album'
    GROUP BY entity_id
  ),
  album_track_counts AS (
    SELECT album_id, COUNT(*) AS track_count
    FROM public.tracks
    WHERE creator_id = p_creator_id AND deleted_at IS NULL AND album_id IS NOT NULL
    GROUP BY album_id
  ),
  ranked AS (
    SELECT
      a.id          AS album_id,
      a.title,
      a.slug,
      a.cover_path,
      a.release_type,
      a.release_date::TEXT          AS release_date,
      COALESCE(atc.track_count, 0)  AS track_count,
      COALESCE(als.valid_streams, 0) AS valid_streams,
      COALESCE(als.total_streams, 0) AS total_streams,
      COALESCE(al.like_count, 0)    AS like_count,
      ROUND(
        (COALESCE(al.like_count, 0) * 0.5
         + COALESCE(als.valid_streams, 0) * 0.02)::NUMERIC, 2
      )             AS engagement_score,
      (COALESCE(als.valid_streams, 0) * 0.7
       + COALESCE(al.like_count, 0) * 0.3) AS rank_score
    FROM public.albums a
    LEFT JOIN album_streams als      ON als.album_id = a.id
    LEFT JOIN album_likes al         ON al.album_id  = a.id
    LEFT JOIN album_track_counts atc ON atc.album_id = a.id
    WHERE a.creator_id         = p_creator_id
      AND a.publication_status = 'published'
      AND a.deleted_at         IS NULL
    ORDER BY rank_score DESC
    LIMIT p_limit
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'album_id',        r.album_id,
      'title',           r.title,
      'slug',            r.slug,
      'cover_path',      r.cover_path,
      'release_type',    r.release_type,
      'release_date',    r.release_date,
      'track_count',     r.track_count,
      'valid_streams',   r.valid_streams,
      'total_streams',   r.total_streams,
      'like_count',      r.like_count,
      'engagement_score',r.engagement_score
    )
    ORDER BY r.rank_score DESC
  ) INTO v_result
  FROM ranked r;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

REVOKE ALL ON FUNCTION public.get_creator_top_albums FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_top_albums TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. get_creator_audience_stats
-- Retourne : followers totaux · croissance 7j/30j · likes · favoris · engagement
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_creator_audience_stats(
  p_creator_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_followers    INTEGER := 0;
  v_creator_followers   INTEGER := 0;
  v_new_followers_7d    INTEGER := 0;
  v_new_followers_30d   INTEGER := 0;
  v_track_likes         INTEGER := 0;
  v_album_favorites     INTEGER := 0;
  v_playlist_followers  INTEGER := 0;
BEGIN
  PERFORM public._assert_creator_owner(p_creator_id);

  -- Abonnés artiste total
  SELECT COUNT(*)::INTEGER INTO v_artist_followers
  FROM public.follows
  WHERE entity_type = 'artist' AND entity_id = p_creator_id;

  -- Abonnés créateur total
  SELECT COUNT(*)::INTEGER INTO v_creator_followers
  FROM public.follows
  WHERE entity_type = 'creator' AND entity_id = p_creator_id;

  -- Nouveaux abonnés (artist+creator) sur 7 jours
  SELECT COUNT(*)::INTEGER INTO v_new_followers_7d
  FROM public.follows
  WHERE entity_id = p_creator_id
    AND entity_type IN ('artist', 'creator')
    AND created_at >= now() - INTERVAL '7 days';

  -- Nouveaux abonnés (artist+creator) sur 30 jours
  SELECT COUNT(*)::INTEGER INTO v_new_followers_30d
  FROM public.follows
  WHERE entity_id = p_creator_id
    AND entity_type IN ('artist', 'creator')
    AND created_at >= now() - INTERVAL '30 days';

  -- Likes sur les tracks du créateur
  SELECT COUNT(*)::INTEGER INTO v_track_likes
  FROM public.favorites f
  JOIN public.tracks t ON t.id = f.entity_id
  WHERE f.entity_type = 'track'
    AND t.creator_id  = p_creator_id
    AND t.deleted_at  IS NULL;

  -- Favoris sur les albums du créateur
  SELECT COUNT(*)::INTEGER INTO v_album_favorites
  FROM public.favorites f
  JOIN public.albums a ON a.id = f.entity_id
  WHERE f.entity_type = 'album'
    AND a.creator_id  = p_creator_id
    AND a.deleted_at  IS NULL;

  -- Abonnés playlists du créateur
  SELECT COUNT(*)::INTEGER INTO v_playlist_followers
  FROM public.follows f
  JOIN public.playlists pl ON pl.id = f.entity_id
  JOIN public.creators c   ON c.owner_id = pl.user_id
  WHERE f.entity_type = 'playlist'
    AND c.id           = p_creator_id
    AND pl.deleted_at  IS NULL;

  RETURN jsonb_build_object(
    'total_followers',       v_artist_followers + v_creator_followers,
    'artist_followers',      v_artist_followers,
    'creator_followers',     v_creator_followers,
    'new_followers_7d',      v_new_followers_7d,
    'new_followers_30d',     v_new_followers_30d,
    'total_track_likes',     v_track_likes,
    'total_album_favorites', v_album_favorites,
    'playlist_followers',    v_playlist_followers,
    'total_engagement',      v_track_likes + v_album_favorites
                             + v_artist_followers + v_creator_followers
                             + v_playlist_followers,
    'engagement_score',      ROUND(
      (v_track_likes * 0.4 + v_album_favorites * 0.3
       + (v_artist_followers + v_creator_followers) * 0.2
       + v_playlist_followers * 0.1)::NUMERIC, 2
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_creator_audience_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_audience_stats TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. get_creator_revenue_stats
-- Retourne : royalties (payées · en attente) · wallet · estimation mensuelle
-- Note : Royalty Engine complet prévu Sprint 8 — fondations seulement ici.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_creator_revenue_stats(
  p_creator_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id              UUID;
  v_wallet_balance        NUMERIC(15,2) := 0;
  v_total_credited        NUMERIC(15,2) := 0;
  v_paid_royalties        NUMERIC(15,2) := 0;
  v_pending_royalties     NUMERIC(15,2) := 0;
  v_total_listen_count    INTEGER       := 0;
  v_month_valid_streams   INTEGER       := 0;
  v_avg_gnf_per_listen    NUMERIC(15,6) := 0;
  v_estimated_monthly_gnf NUMERIC(15,2) := 0;
BEGIN
  PERFORM public._assert_creator_owner(p_creator_id);

  -- Récupérer l'owner_id du créateur (= auth.uid() déjà validé ci-dessus)
  SELECT owner_id INTO v_owner_id FROM public.creators WHERE id = p_creator_id;

  -- Solde et total crédité du wallet
  SELECT
    COALESCE(balance_gnf, 0),
    COALESCE(total_credited_gnf, 0)
  INTO v_wallet_balance, v_total_credited
  FROM public.wallets
  WHERE user_id = v_owner_id;

  -- Royalties payées et en attente depuis royalty_calculations
  SELECT
    COALESCE(SUM(CASE WHEN status = 'paid'                      THEN net_amount_gnf ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status IN ('pending', 'approved')    THEN net_amount_gnf ELSE 0 END), 0),
    COALESCE(SUM(valid_listen_count), 0)
  INTO v_paid_royalties, v_pending_royalties, v_total_listen_count
  FROM public.royalty_calculations
  WHERE artist_id = v_owner_id;

  -- Streams valides du dernier mois glissant (pour projection)
  WITH creator_tracks AS (
    SELECT id FROM public.tracks
    WHERE creator_id = p_creator_id AND deleted_at IS NULL
  )
  SELECT COUNT(*)::INTEGER INTO v_month_valid_streams
  FROM public.stream_sessions ss
  JOIN creator_tracks ct ON ss.track_id = ct.id
  WHERE ss.is_valid_listen = true
    AND ss.started_at >= now() - INTERVAL '30 days';

  -- GNF moyen par écoute valide (basé sur l'historique des royalties payées)
  IF v_total_listen_count > 0 THEN
    v_avg_gnf_per_listen := ROUND(v_paid_royalties / v_total_listen_count, 6);
  END IF;

  -- Projection mensuelle = streams du mois × avg par écoute
  v_estimated_monthly_gnf := ROUND(v_month_valid_streams * v_avg_gnf_per_listen, 2);

  RETURN jsonb_build_object(
    'total_royalties_gnf',     v_paid_royalties + v_pending_royalties,
    'paid_royalties_gnf',      v_paid_royalties,
    'pending_royalties_gnf',   v_pending_royalties,
    'wallet_balance_gnf',      v_wallet_balance,
    'total_credited_gnf',      v_total_credited,
    'valid_listen_count',      v_total_listen_count,
    'avg_gnf_per_listen',      v_avg_gnf_per_listen,
    'month_valid_streams',     v_month_valid_streams,
    'estimated_monthly_gnf',   v_estimated_monthly_gnf
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_creator_revenue_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_revenue_stats TO authenticated;
