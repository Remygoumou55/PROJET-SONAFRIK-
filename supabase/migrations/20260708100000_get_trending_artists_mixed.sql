-- ============================================================
-- get_trending_artists_mixed()
-- Artistes tendance : fusion today/7d/30d, déduplication par meilleur score
-- Même logique Real Listen que get_trending_tracks (is_valid_listen + fraud_flags)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_trending_artists_mixed(
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lim    INTEGER;
  v_result JSONB;
BEGIN
  v_lim := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);

  WITH today_scores AS (
    SELECT
      ap.creator_id,
      ap.stage_name,
      ap.slug,
      public.resolve_track_cover_path(
        NULL,
        ap.profile_photo,
        ap.cover_path,
        ap.cover_images
      )                     AS cover_path,
      ap.verified,
      COUNT(ss.id)          AS listen_count
    FROM public.stream_sessions ss
    JOIN public.tracks t
      ON t.id = ss.track_id
      AND t.deleted_at IS NULL
      AND t.publication_status = 'published'
    JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
    WHERE ss.is_valid_listen = true
      AND COALESCE(ss.fraud_flags, '{}') = '{}'
      AND ss.started_at >= date_trunc('day', now())
    GROUP BY
      ap.creator_id, ap.stage_name, ap.slug,
      ap.profile_photo, ap.cover_path, ap.cover_images, ap.verified
  ),

  week_scores AS (
    SELECT
      ap.creator_id,
      ap.stage_name,
      ap.slug,
      public.resolve_track_cover_path(
        NULL,
        ap.profile_photo,
        ap.cover_path,
        ap.cover_images
      )                     AS cover_path,
      ap.verified,
      COUNT(ss.id)          AS listen_count
    FROM public.stream_sessions ss
    JOIN public.tracks t
      ON t.id = ss.track_id
      AND t.deleted_at IS NULL
      AND t.publication_status = 'published'
    JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
    WHERE ss.is_valid_listen = true
      AND COALESCE(ss.fraud_flags, '{}') = '{}'
      AND ss.started_at >= now() - INTERVAL '7 days'
    GROUP BY
      ap.creator_id, ap.stage_name, ap.slug,
      ap.profile_photo, ap.cover_path, ap.cover_images, ap.verified
  ),

  month_scores AS (
    SELECT
      ap.creator_id,
      ap.stage_name,
      ap.slug,
      public.resolve_track_cover_path(
        NULL,
        ap.profile_photo,
        ap.cover_path,
        ap.cover_images
      )                     AS cover_path,
      ap.verified,
      COUNT(ss.id)          AS listen_count
    FROM public.stream_sessions ss
    JOIN public.tracks t
      ON t.id = ss.track_id
      AND t.deleted_at IS NULL
      AND t.publication_status = 'published'
    JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
    WHERE ss.is_valid_listen = true
      AND COALESCE(ss.fraud_flags, '{}') = '{}'
      AND ss.started_at >= now() - INTERVAL '30 days'
    GROUP BY
      ap.creator_id, ap.stage_name, ap.slug,
      ap.profile_photo, ap.cover_path, ap.cover_images, ap.verified
  ),

  -- Pondération fraîcheur : today×3 bat 7d×2 bat 30d×1
  -- DISTINCT ON (creator_id) ORDER BY weighted_score DESC = garder le meilleur
  all_scores AS (
    SELECT creator_id, stage_name, slug, cover_path, verified,
           listen_count * 3 AS weighted_score, listen_count
    FROM   today_scores
    UNION ALL
    SELECT creator_id, stage_name, slug, cover_path, verified,
           listen_count * 2 AS weighted_score, listen_count
    FROM   week_scores
    UNION ALL
    SELECT creator_id, stage_name, slug, cover_path, verified,
           listen_count     AS weighted_score, listen_count
    FROM   month_scores
  ),

  deduped AS (
    SELECT DISTINCT ON (creator_id)
      creator_id, stage_name, slug, cover_path, verified, listen_count
    FROM  all_scores
    ORDER BY creator_id, weighted_score DESC
  )

  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
  INTO   v_result
  FROM (
    SELECT jsonb_build_object(
      'creator_id',   creator_id,
      'stage_name',   stage_name,
      'slug',         slug,
      'cover_path',   cover_path,
      'verified',     verified,
      'listen_count', listen_count
    ) AS row_data
    FROM   deduped
    ORDER  BY listen_count DESC
    LIMIT  v_lim
  ) subq;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL   ON FUNCTION public.get_trending_artists_mixed(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trending_artists_mixed(INTEGER) TO authenticated, anon;
