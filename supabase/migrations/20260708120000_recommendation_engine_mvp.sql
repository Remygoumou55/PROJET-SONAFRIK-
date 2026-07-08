-- ============================================================
-- get_recommended_tracks_mvp()
-- Moteur de recommandations MVP — 4 signaux combinés
-- Architecture: remplaçable par IA sans modifier les composants UI
-- Uses auth.uid() — pas de paramètre user_id (sécurité + simplicité)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recommended_tracks_mvp(
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    UUID;
  v_lim    INTEGER;
  v_result JSONB;
BEGIN
  v_uid := auth.uid();
  v_lim := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);

  WITH
  -- Signal genre : genres préférés de l'utilisateur (30 derniers jours)
  user_genres AS (
    SELECT tg.genre_id, COUNT(*) AS cnt
    FROM public.stream_sessions ss
    JOIN public.track_genres tg ON tg.track_id = ss.track_id
    WHERE ss.user_id = v_uid
      AND ss.is_valid_listen = true
      AND COALESCE(ss.fraud_flags, '{}') = '{}'
      AND ss.started_at > NOW() - INTERVAL '30 days'
    GROUP BY tg.genre_id
    ORDER BY cnt DESC
    LIMIT 5
  ),

  -- Signal "déjà entendu" : tracks écoutés dans les 90 derniers jours
  heard AS (
    SELECT DISTINCT track_id
    FROM public.stream_sessions
    WHERE user_id = v_uid
      AND started_at > NOW() - INTERVAL '90 days'
  ),

  -- Signal tendance : écoutes valides Real Listen (7 derniers jours)
  trend_raw AS (
    SELECT track_id, COUNT(*) AS cnt
    FROM public.stream_sessions
    WHERE is_valid_listen = true
      AND COALESCE(fraud_flags, '{}') = '{}'
      AND started_at > NOW() - INTERVAL '7 days'
    GROUP BY track_id
  ),
  max_trend AS (
    SELECT GREATEST(MAX(cnt), 1)::float AS m FROM trend_raw
  ),

  -- Score combiné des morceaux candidats
  scored AS (
    SELECT
      t.id                    AS track_id,
      t.title,
      t.slug,
      t.duration_seconds,
      t.creator_id,
      t.album_id,
      t.published_at,
      al.title                AS album_title,
      ap.stage_name           AS artist_name,
      public.resolve_track_cover_path(
        al.cover_path,
        ap.profile_photo,
        ap.cover_path,
        ap.cover_images
      )                       AS cover_path,

      -- Tendance (0–30 pts) : normalisé sur le max de la période
      COALESCE(tr.cnt::float / mt.m * 30, 0) AS s_trend,

      -- Affinité genre (0 ou 30 pts)
      CASE
        WHEN v_uid IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.track_genres tg
          JOIN user_genres ug ON ug.genre_id = tg.genre_id
          WHERE tg.track_id = t.id
        ) THEN 30 ELSE 0
      END AS s_genre,

      -- Fraîcheur (0, 10 ou 20 pts)
      CASE
        WHEN t.published_at > NOW() - INTERVAL '7 days'  THEN 20
        WHEN t.published_at > NOW() - INTERVAL '30 days' THEN 10
        ELSE 0
      END AS s_fresh,

      -- Inédit pour l'utilisateur (0 ou 20 pts)
      CASE WHEN h.track_id IS NULL THEN 20 ELSE 0 END AS s_new

    FROM public.tracks t
    JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
    LEFT JOIN public.albums al     ON al.id = t.album_id AND al.deleted_at IS NULL
    LEFT JOIN trend_raw tr         ON tr.track_id = t.id
    LEFT JOIN max_trend mt         ON true
    LEFT JOIN heard h              ON h.track_id = t.id
    WHERE t.publication_status = 'published'
      AND t.deleted_at IS NULL
  ),

  ranked AS (
    SELECT
      *,
      (s_trend + s_genre + s_fresh + s_new) AS total_score,
      CASE
        WHEN s_genre >= s_trend AND s_genre > 0 THEN 'genre_affinity'
        WHEN s_fresh > s_trend AND s_fresh > 0  THEN 'new_release'
        ELSE 'trending'
      END AS reason
    FROM scored
    ORDER BY
      (s_trend + s_genre + s_fresh + s_new) DESC,
      -- Légère entropie pour éviter un classement toujours identique
      RANDOM() * 5
    LIMIT v_lim
  )

  SELECT jsonb_agg(
    jsonb_build_object(
      'track_id',            r.track_id,
      'title',               r.title,
      'slug',                r.slug,
      'duration_seconds',    r.duration_seconds,
      'artist_name',         r.artist_name,
      'creator_id',          r.creator_id,
      'album_id',            r.album_id,
      'album_title',         r.album_title,
      'cover_path',          r.cover_path,
      'recommendation_score', ROUND(r.total_score::numeric, 1),
      'reason',              r.reason
    )
  ) INTO v_result
  FROM ranked r;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recommended_tracks_mvp(INTEGER) TO authenticated, anon;
