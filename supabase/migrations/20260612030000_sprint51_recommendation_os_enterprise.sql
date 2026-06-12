-- Sprint 5.1 — Recommendation OS Enterprise
-- Trending Engine (today/7d/30d) · Similar Tracks · Discovery Engine · Personalized Recommendations
-- Toutes les fonctions utilisent SECURITY DEFINER et auth.uid() pour la sécurité

-- ---------------------------------------------------------------------------
-- Index supplémentaires sur stream_sessions pour les requêtes fenêtrées
-- (les index existants couvrent track_id+started_at et is_valid_listen)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_stream_sessions_valid_window
  ON public.stream_sessions(started_at DESC, track_id)
  WHERE is_valid_listen = true;

CREATE INDEX IF NOT EXISTS idx_stream_sessions_user_valid
  ON public.stream_sessions(user_id, track_id, started_at DESC)
  WHERE is_valid_listen = true;

-- ---------------------------------------------------------------------------
-- RPC get_trending_tracks — Trending Engine
-- Classement des morceaux par écoutes valides sur une fenêtre glissante.
-- p_window : 'today' | '7d' | '30d'
-- Retourne JSONB tableau de TrendingTrack
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_trending_tracks(
  p_window TEXT    DEFAULT '7d',
  p_limit  INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since  TIMESTAMPTZ;
  v_lim    INTEGER;
  v_result JSONB;
BEGIN
  v_lim   := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_since := CASE p_window
    WHEN 'today' THEN date_trunc('day', now())
    WHEN '7d'    THEN now() - INTERVAL '7 days'
    WHEN '30d'   THEN now() - INTERVAL '30 days'
    ELSE now() - INTERVAL '7 days'
  END;

  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'track_id',         t.id,
      'title',            t.title,
      'slug',             t.slug,
      'duration_seconds', t.duration_seconds,
      'artist_name',      ap.stage_name,
      'creator_id',       t.creator_id,
      'album_id',         t.album_id,
      'album_title',      al.title,
      'cover_path',       al.cover_path,
      'listen_count',     COUNT(ss.id),
      'unique_listeners', COUNT(DISTINCT ss.user_id),
      'trending_score',   ROUND(
        COUNT(ss.id)::numeric
        * (1 + COUNT(DISTINCT ss.user_id)::numeric
               / GREATEST(COUNT(ss.id)::numeric, 1)),
        4)
    ) AS row_data,
    COUNT(ss.id) AS sort_count
    FROM public.stream_sessions ss
    JOIN public.tracks t
      ON t.id = ss.track_id
      AND t.deleted_at IS NULL
      AND t.publication_status = 'published'
    LEFT JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
    LEFT JOIN public.albums al
      ON al.id = t.album_id
      AND al.deleted_at IS NULL
    WHERE ss.is_valid_listen = true
      AND ss.started_at >= v_since
    GROUP BY t.id, t.title, t.slug, t.duration_seconds, t.creator_id, t.album_id,
             ap.stage_name, al.title, al.cover_path
    ORDER BY sort_count DESC, COUNT(DISTINCT ss.user_id) DESC
    LIMIT v_lim
  ) subq;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_trending_tracks FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trending_tracks TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- RPC get_similar_tracks — Discovery Engine
-- Similarité basée sur : overlap de genres + même artiste + co-écoutes (CF).
-- Retourne JSONB tableau de SimilarTrack
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_similar_tracks(
  p_track_id UUID,
  p_limit    INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lim     INTEGER;
  v_creator UUID;
  v_result  JSONB;
BEGIN
  v_lim := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);

  SELECT creator_id INTO v_creator
  FROM public.tracks
  WHERE id = p_track_id AND deleted_at IS NULL;

  IF v_creator IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(row_data ORDER BY total_score DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      t.id,
      jsonb_build_object(
        'track_id',           t.id,
        'title',              t.title,
        'slug',               t.slug,
        'duration_seconds',   t.duration_seconds,
        'artist_name',        ap.stage_name,
        'creator_id',         t.creator_id,
        'album_id',           t.album_id,
        'album_title',        al.title,
        'cover_path',         al.cover_path,
        'similarity_score',   ROUND(COALESCE(gs.genre_score, 0) + COALESCE(as2.artist_score, 0) + COALESCE(cf.collab_score, 0), 4),
        'similarity_reasons', ARRAY_REMOVE(ARRAY[
          CASE WHEN COALESCE(gs.genre_score, 0) > 0  THEN 'genre'        END,
          CASE WHEN COALESCE(as2.artist_score, 0) > 0 THEN 'same_artist' END,
          CASE WHEN COALESCE(cf.collab_score, 0) > 0  THEN 'collaborative' END
        ], NULL)
      ) AS row_data,
      COALESCE(gs.genre_score, 0) + COALESCE(as2.artist_score, 0) + COALESCE(cf.collab_score, 0) AS total_score
    FROM public.tracks t
    LEFT JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
    LEFT JOIN public.albums al ON al.id = t.album_id AND al.deleted_at IS NULL
    -- Genre overlap : score = 0.4 * nb_genres_communs
    LEFT JOIN (
      SELECT tg2.track_id, COUNT(*)::numeric * 0.4 AS genre_score
      FROM public.track_genres tg1
      JOIN public.track_genres tg2
        ON tg2.genre_id = tg1.genre_id
        AND tg2.track_id != p_track_id
      WHERE tg1.track_id = p_track_id
      GROUP BY tg2.track_id
    ) gs ON gs.track_id = t.id
    -- Même artiste
    LEFT JOIN (
      SELECT id AS track_id, 0.3::numeric AS artist_score
      FROM public.tracks
      WHERE creator_id = v_creator
        AND id != p_track_id
        AND deleted_at IS NULL
        AND publication_status = 'published'
    ) as2 ON as2.track_id = t.id
    -- Co-écoutes collaborative filtering (fenêtre 30j)
    LEFT JOIN (
      SELECT other_ss.track_id,
        LEAST(COUNT(*)::numeric * 0.05, 0.4) AS collab_score
      FROM public.stream_sessions my_ss
      JOIN public.stream_sessions other_ss
        ON other_ss.user_id = my_ss.user_id
        AND other_ss.track_id != p_track_id
        AND other_ss.is_valid_listen = true
      WHERE my_ss.track_id = p_track_id
        AND my_ss.is_valid_listen = true
        AND my_ss.started_at >= now() - INTERVAL '30 days'
      GROUP BY other_ss.track_id
    ) cf ON cf.track_id = t.id
    WHERE t.id != p_track_id
      AND t.deleted_at IS NULL
      AND t.publication_status = 'published'
      AND (gs.genre_score IS NOT NULL OR as2.artist_score IS NOT NULL OR cf.collab_score IS NOT NULL)
    ORDER BY total_score DESC
    LIMIT v_lim
  ) ranked;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_similar_tracks FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_similar_tracks TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- RPC get_recommendations — Personalized Discovery Engine
-- Recommandations personnalisées pour auth.uid() :
--   1. Genre affinity  (historique 30j → poids par genre)
--   2. Trending picks  (morceaux populaires non encore entendus)
--   3. New releases    (publiés dans les 14 derniers jours)
-- Déduplique par track_id et prend le meilleur score.
-- Retourne JSONB tableau de RecommendedTrack
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_recommendations(
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_lim     INTEGER;
  v_result  JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  v_lim := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);

  SELECT COALESCE(jsonb_agg(row_data ORDER BY best_score DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      jsonb_build_object(
        'track_id',             t.id,
        'title',                t.title,
        'slug',                 t.slug,
        'duration_seconds',     t.duration_seconds,
        'artist_name',          ap.stage_name,
        'creator_id',           t.creator_id,
        'album_id',             t.album_id,
        'album_title',          al.title,
        'cover_path',           al.cover_path,
        'recommendation_score', ROUND(d.best_score, 4),
        'reason',               d.rec_reason
      ) AS row_data,
      d.best_score
    FROM (
      -- Déduplique par track_id, garde le meilleur score
      SELECT DISTINCT ON (track_id) track_id, rec_score AS best_score, rec_reason
      FROM (
        -- Source 1 : Genre affinity
        SELECT tg.track_id,
          COALESCE(gw.weight, 0) * 0.6 AS rec_score,
          'genre_affinity'::text AS rec_reason
        FROM public.track_genres tg
        JOIN (
          SELECT tg2.genre_id,
            COUNT(*)::numeric / GREATEST(SUM(COUNT(*)) OVER (), 1) AS weight
          FROM public.stream_sessions ss
          JOIN public.track_genres tg2 ON tg2.track_id = ss.track_id
          WHERE ss.user_id = v_user_id
            AND ss.is_valid_listen = true
            AND ss.started_at >= now() - INTERVAL '30 days'
          GROUP BY tg2.genre_id
        ) gw ON gw.genre_id = tg.genre_id
        WHERE tg.track_id NOT IN (
          SELECT track_id FROM public.stream_sessions
          WHERE user_id = v_user_id
            AND started_at >= now() - INTERVAL '7 days'
        )

        UNION ALL

        -- Source 2 : Trending (morceaux non entendus récemment)
        SELECT ss.track_id,
          LEAST(COUNT(*)::numeric / 20.0, 1.0) * 0.4 AS rec_score,
          'trending'::text AS rec_reason
        FROM public.stream_sessions ss
        WHERE ss.is_valid_listen = true
          AND ss.started_at >= now() - INTERVAL '7 days'
          AND ss.track_id NOT IN (
            SELECT track_id FROM public.stream_sessions
            WHERE user_id = v_user_id
              AND started_at >= now() - INTERVAL '7 days'
          )
        GROUP BY ss.track_id

        UNION ALL

        -- Source 3 : New releases (publiés dans les 14 derniers jours)
        SELECT t2.id AS track_id,
          0.5 AS rec_score,
          'new_release'::text AS rec_reason
        FROM public.tracks t2
        WHERE t2.deleted_at IS NULL
          AND t2.publication_status = 'published'
          AND t2.published_at >= now() - INTERVAL '14 days'
          AND t2.id NOT IN (
            SELECT track_id FROM public.stream_sessions
            WHERE user_id = v_user_id
              AND started_at >= now() - INTERVAL '7 days'
          )
      ) all_candidates
      ORDER BY track_id, rec_score DESC
    ) d
    JOIN public.tracks t
      ON t.id = d.track_id
      AND t.deleted_at IS NULL
      AND t.publication_status = 'published'
    LEFT JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
    LEFT JOIN public.albums al ON al.id = t.album_id AND al.deleted_at IS NULL
    ORDER BY d.best_score DESC
    LIMIT v_lim
  ) final_recs;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_recommendations FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_recommendations TO authenticated;
