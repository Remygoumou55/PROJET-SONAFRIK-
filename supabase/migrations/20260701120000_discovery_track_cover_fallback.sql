-- Fallback cover morceau : album → photo profil artiste → cover artiste → galerie hero
-- Corrige les cards Découvertes / Top Guinée pour les singles sans pochette album.

BEGIN;

CREATE OR REPLACE FUNCTION public.resolve_track_cover_path(
  p_album_cover TEXT,
  p_profile_photo TEXT,
  p_artist_cover TEXT,
  p_cover_images TEXT[]
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT COALESCE(
    NULLIF(BTRIM(p_album_cover), ''),
    NULLIF(BTRIM(p_profile_photo), ''),
    NULLIF(BTRIM(p_artist_cover), ''),
    CASE
      WHEN p_cover_images IS NOT NULL AND array_length(p_cover_images, 1) > 0
        THEN NULLIF(BTRIM(p_cover_images[1]), '')
      ELSE NULL
    END
  );
$$;

CREATE OR REPLACE FUNCTION public.get_discovery_feed(p_limit INTEGER DEFAULT 20)
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
  v_lim     := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);

  WITH
  user_artist_history AS (
    SELECT DISTINCT t.creator_id
    FROM public.stream_sessions ss
    JOIN public.tracks t ON t.id = ss.track_id
    WHERE v_user_id IS NOT NULL
      AND ss.user_id = v_user_id
      AND ss.started_at >= now() - INTERVAL '30 days'
  ),
  user_recent_tracks AS (
    SELECT DISTINCT track_id
    FROM public.stream_sessions
    WHERE v_user_id IS NOT NULL
      AND user_id = v_user_id
      AND started_at >= now() - INTERVAL '14 days'
  ),
  track_likes AS (
    SELECT track_id, COUNT(*)::integer AS like_count
    FROM public.likes
    GROUP BY track_id
  ),
  track_streams AS (
    SELECT track_id, COUNT(*)::integer AS stream_count
    FROM public.stream_sessions
    WHERE is_valid_listen = true
      AND started_at >= now() - INTERVAL '7 days'
    GROUP BY track_id
  )
  SELECT COALESCE(jsonb_agg(row_data ORDER BY disc_score DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      jsonb_build_object(
        'track_id',         t.id,
        'title',            t.title,
        'slug',             t.slug,
        'duration_seconds', t.duration_seconds,
        'artist_name',      ap.stage_name,
        'creator_id',       t.creator_id,
        'album_id',         t.album_id,
        'album_title',      al.title,
        'cover_path',       public.resolve_track_cover_path(
                              al.cover_path,
                              ap.profile_photo,
                              ap.cover_path,
                              ap.cover_images
                            ),
        'published_at',     t.published_at,
        'like_count',       COALESCE(lc.like_count, 0),
        'stream_count',     COALESCE(sc.stream_count, 0),
        'discovery_score',  ROUND(
          COALESCE(lc.like_count, 0)::numeric * 0.4
          + COALESCE(sc.stream_count, 0)::numeric * 0.05
          + CASE
              WHEN t.published_at >= now() - INTERVAL '7 days'  THEN 4.0
              WHEN t.published_at >= now() - INTERVAL '30 days' THEN 2.0
              WHEN t.published_at >= now() - INTERVAL '90 days' THEN 1.0
              ELSE 0.0
            END
          + CASE WHEN uah.creator_id IS NULL THEN 2.0 ELSE 0.0 END,
          4)
      ) AS row_data,
      COALESCE(lc.like_count, 0)::numeric * 0.4
      + COALESCE(sc.stream_count, 0)::numeric * 0.05
      + CASE
          WHEN t.published_at >= now() - INTERVAL '7 days'  THEN 4.0
          WHEN t.published_at >= now() - INTERVAL '30 days' THEN 2.0
          WHEN t.published_at >= now() - INTERVAL '90 days' THEN 1.0
          ELSE 0.0
        END
      + CASE WHEN uah.creator_id IS NULL THEN 2.0 ELSE 0.0 END AS disc_score
    FROM public.tracks t
    LEFT JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
    LEFT JOIN public.albums al
      ON al.id = t.album_id AND al.deleted_at IS NULL
    LEFT JOIN track_likes lc ON lc.track_id = t.id
    LEFT JOIN track_streams sc ON sc.track_id = t.id
    LEFT JOIN user_recent_tracks urt ON urt.track_id = t.id
    LEFT JOIN user_artist_history uah ON uah.creator_id = t.creator_id
    WHERE t.deleted_at IS NULL
      AND t.publication_status = 'published'
      AND urt.track_id IS NULL
    ORDER BY disc_score DESC
    LIMIT v_lim
  ) ranked;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

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
  v_lim := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_since := CASE p_window
    WHEN 'today' THEN date_trunc('day', now())
    WHEN '7d'    THEN now() - INTERVAL '7 days'
    WHEN '30d'   THEN now() - INTERVAL '30 days'
    WHEN 'all'   THEN NULL
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
      'cover_path',       public.resolve_track_cover_path(
                            al.cover_path,
                            ap.profile_photo,
                            ap.cover_path,
                            ap.cover_images
                          ),
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
      AND COALESCE(ss.fraud_flags, '{}') = '{}'
      AND (v_since IS NULL OR ss.started_at >= v_since)
    GROUP BY t.id, t.title, t.slug, t.duration_seconds, t.creator_id, t.album_id,
             ap.stage_name, al.title, al.cover_path,
             ap.profile_photo, ap.cover_path, ap.cover_images
    ORDER BY sort_count DESC, COUNT(DISTINCT ss.user_id) DESC
    LIMIT v_lim
  ) subq;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_new_releases(
  p_type  TEXT    DEFAULT 'all',
  p_days  INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since   TIMESTAMPTZ;
  v_lim     INTEGER;
  v_tracks  JSONB := '[]'::jsonb;
  v_albums  JSONB := '[]'::jsonb;
  v_artists JSONB := '[]'::jsonb;
BEGIN
  v_since := now() - (LEAST(GREATEST(COALESCE(p_days, 30), 1), 365) * INTERVAL '1 day');
  v_lim   := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);

  IF p_type IN ('track', 'all') THEN
    SELECT COALESCE(jsonb_agg(row_data ORDER BY pub_at DESC), '[]'::jsonb)
    INTO v_tracks
    FROM (
      SELECT
        jsonb_build_object(
          'track_id',         t.id,
          'title',            t.title,
          'slug',             t.slug,
          'duration_seconds', t.duration_seconds,
          'artist_name',      ap.stage_name,
          'creator_id',       t.creator_id,
          'album_id',         t.album_id,
          'album_title',      al.title,
          'cover_path',       public.resolve_track_cover_path(
                                al.cover_path,
                                ap.profile_photo,
                                ap.cover_path,
                                ap.cover_images
                              ),
          'published_at',     t.published_at,
          'like_count',       0,
          'stream_count',     0,
          'discovery_score',  0
        ) AS row_data,
        t.published_at AS pub_at
      FROM public.tracks t
      LEFT JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
      LEFT JOIN public.albums al ON al.id = t.album_id AND al.deleted_at IS NULL
      WHERE t.deleted_at IS NULL
        AND t.publication_status = 'published'
        AND t.published_at >= v_since
      ORDER BY t.published_at DESC
      LIMIT v_lim
    ) sub;
  END IF;

  IF p_type IN ('album', 'all') THEN
    SELECT COALESCE(jsonb_agg(row_data ORDER BY pub_at DESC), '[]'::jsonb)
    INTO v_albums
    FROM (
      SELECT
        jsonb_build_object(
          'id',            al.id,
          'title',         al.title,
          'slug',          al.slug,
          'release_type',  al.release_type,
          'cover_path',    al.cover_path,
          'release_date',  al.release_date,
          'artist_name',   ap.stage_name,
          'creator_id',    al.creator_id,
          'published_at',  al.published_at,
          'like_count',    0,
          'stream_count',  0,
          'discovery_score', 0
        ) AS row_data,
        al.published_at AS pub_at
      FROM public.albums al
      LEFT JOIN public.artist_profiles ap ON ap.creator_id = al.creator_id
      WHERE al.deleted_at IS NULL
        AND al.publication_status = 'published'
        AND al.published_at >= v_since
      ORDER BY al.published_at DESC
      LIMIT v_lim
    ) sub;
  END IF;

  IF p_type IN ('artist', 'all') THEN
    SELECT COALESCE(jsonb_agg(row_data ORDER BY creat_at DESC), '[]'::jsonb)
    INTO v_artists
    FROM (
      SELECT
        jsonb_build_object(
          'creator_id',  ap.creator_id,
          'stage_name',  ap.stage_name,
          'slug',        ap.slug,
          'bio',         ap.bio,
          'genres',      ap.genres,
          'cover_path',  public.resolve_track_cover_path(
                           NULL,
                           ap.profile_photo,
                           ap.cover_path,
                           ap.cover_images
                         ),
          'verified',    ap.verified,
          'created_at',  ap.created_at,
          'follower_count', 0,
          'stream_count',   0,
          'discovery_score', 0
        ) AS row_data,
        ap.created_at AS creat_at
      FROM public.artist_profiles ap
      INNER JOIN public.creators c
        ON c.id = ap.creator_id
        AND c.deleted_at IS NULL
        AND c.status = 'active'
      WHERE ap.is_public = true
        AND ap.created_at >= v_since
      ORDER BY ap.created_at DESC
      LIMIT v_lim
    ) sub;
  END IF;

  RETURN jsonb_build_object(
    'tracks',  v_tracks,
    'albums',  v_albums,
    'artists', v_artists
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_track_cover_path FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_track_cover_path TO authenticated, anon;

REVOKE ALL ON FUNCTION public.get_discovery_feed FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_discovery_feed TO authenticated, anon;

REVOKE ALL ON FUNCTION public.get_trending_tracks FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trending_tracks TO authenticated, anon;

REVOKE ALL ON FUNCTION public.get_new_releases FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_new_releases TO authenticated, anon;

COMMIT;
