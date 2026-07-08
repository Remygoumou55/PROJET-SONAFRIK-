-- ============================================================
-- Hero Discovery Engine — Lot A
-- 1. get_trending_artists_mixed() enrichie (genre, bio, first_track)
-- 2. get_hero_featured_albums() — albums publiés ≤ 30 jours
-- ============================================================

-- ── 1. Enrichissement de get_trending_artists_mixed ──────────────────────────

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
      ap.genres,
      ap.bio,
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
      ap.profile_photo, ap.cover_path, ap.cover_images,
      ap.verified, ap.genres, ap.bio
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
      ap.genres,
      ap.bio,
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
      ap.profile_photo, ap.cover_path, ap.cover_images,
      ap.verified, ap.genres, ap.bio
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
      ap.genres,
      ap.bio,
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
      ap.profile_photo, ap.cover_path, ap.cover_images,
      ap.verified, ap.genres, ap.bio
  ),

  all_scores AS (
    SELECT creator_id, stage_name, slug, cover_path, verified, genres, bio,
           listen_count * 3 AS weighted_score, listen_count
    FROM   today_scores
    UNION ALL
    SELECT creator_id, stage_name, slug, cover_path, verified, genres, bio,
           listen_count * 2 AS weighted_score, listen_count
    FROM   week_scores
    UNION ALL
    SELECT creator_id, stage_name, slug, cover_path, verified, genres, bio,
           listen_count     AS weighted_score, listen_count
    FROM   month_scores
  ),

  deduped AS (
    SELECT DISTINCT ON (creator_id)
      creator_id, stage_name, slug, cover_path, verified, genres, bio, listen_count
    FROM  all_scores
    ORDER BY creator_id, weighted_score DESC
  )

  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
  INTO   v_result
  FROM (
    SELECT jsonb_build_object(
      'content_type',    'artist',
      'creator_id',      d.creator_id,
      'stage_name',      d.stage_name,
      'slug',            d.slug,
      'cover_path',      d.cover_path,
      'verified',        d.verified,
      'listen_count',    d.listen_count,
      'genre_primary',   NULLIF(BTRIM(COALESCE(d.genres[1], '')), ''),
      'bio_short',       NULLIF(LEFT(BTRIM(COALESCE(d.bio, '')), 110), ''),
      'first_track_id',  ft.id,
      'first_track_slug', ft.slug
    ) AS row_data
    FROM   deduped d
    LEFT JOIN LATERAL (
      SELECT t.id, t.slug
      FROM   public.tracks t
      WHERE  t.creator_id = d.creator_id
        AND  t.publication_status = 'published'
        AND  t.deleted_at IS NULL
      ORDER  BY t.created_at DESC
      LIMIT  1
    ) ft ON true
    ORDER  BY d.listen_count DESC
    LIMIT  v_lim
  ) subq;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL   ON FUNCTION public.get_trending_artists_mixed(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trending_artists_mixed(INTEGER) TO authenticated, anon;


-- ── 2. get_hero_featured_albums ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_hero_featured_albums(
  p_days  INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 6
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
  v_since := now() - (LEAST(GREATEST(COALESCE(p_days, 30), 1), 365) * INTERVAL '1 day');
  v_lim   := LEAST(GREATEST(COALESCE(p_limit, 6), 1), 20);

  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
  INTO   v_result
  FROM (
    SELECT jsonb_build_object(
      'content_type',  'album',
      'album_id',      al.id,
      'album_title',   al.title,
      'release_type',  COALESCE(al.release_type, 'album'),
      'release_date',  al.release_date::text,
      'cover_path',    public.resolve_track_cover_path(
                         al.cover_path,
                         ap.profile_photo,
                         ap.cover_path,
                         ap.cover_images
                       ),
      'creator_id',    al.creator_id,
      'stage_name',    ap.stage_name,
      'artist_slug',   ap.slug,
      'genre_primary', NULLIF(BTRIM(COALESCE(ap.genres[1], '')), ''),
      'verified',      ap.verified,
      'bio_short',     NULLIF(LEFT(BTRIM(COALESCE(al.description, '')), 110), '')
    ) AS row_data
    FROM   public.albums al
    JOIN   public.artist_profiles ap ON ap.creator_id = al.creator_id
    WHERE  al.publication_status = 'published'
      AND  al.deleted_at IS NULL
      AND  al.published_at >= v_since
    ORDER  BY al.published_at DESC
    LIMIT  v_lim
  ) subq;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL   ON FUNCTION public.get_hero_featured_albums(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_hero_featured_albums(INTEGER, INTEGER) TO authenticated, anon;
