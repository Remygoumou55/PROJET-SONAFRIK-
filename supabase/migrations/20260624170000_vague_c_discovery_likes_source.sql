-- Vague C1b — Discovery + analytics : source likes = table public.likes (pas favorites track)
-- Complète 20260624160000_vague_c_likes_separation.sql

BEGIN;

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
        'cover_path',       al.cover_path,
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

CREATE OR REPLACE FUNCTION public.get_suggested_albums(p_limit INTEGER DEFAULT 10)
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
  v_lim     := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);

  WITH
  album_likes AS (
    SELECT t.album_id, COUNT(l.track_id)::integer AS like_count
    FROM public.likes l
    JOIN public.tracks t ON t.id = l.track_id
    WHERE t.album_id IS NOT NULL
      AND t.deleted_at IS NULL
    GROUP BY t.album_id
  ),
  album_streams AS (
    SELECT t.album_id, COUNT(ss.id)::integer AS stream_count
    FROM public.stream_sessions ss
    JOIN public.tracks t ON t.id = ss.track_id
    WHERE ss.is_valid_listen = true
      AND ss.started_at >= now() - INTERVAL '30 days'
      AND t.album_id IS NOT NULL
    GROUP BY t.album_id
  ),
  favorited_albums AS (
    SELECT entity_id AS album_id
    FROM public.favorites
    WHERE v_user_id IS NOT NULL
      AND user_id = v_user_id
      AND entity_type = 'album'
  )
  SELECT COALESCE(jsonb_agg(row_data ORDER BY disc_score DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      jsonb_build_object(
        'id',              al.id,
        'title',           al.title,
        'slug',            al.slug,
        'release_type',    al.release_type,
        'cover_path',      al.cover_path,
        'release_date',    al.release_date,
        'artist_name',     ap.stage_name,
        'creator_id',      al.creator_id,
        'published_at',    al.published_at,
        'like_count',      COALESCE(alk.like_count, 0),
        'stream_count',    COALESCE(asm.stream_count, 0),
        'discovery_score', ROUND(
          COALESCE(alk.like_count, 0)::numeric * 0.5
          + COALESCE(asm.stream_count, 0)::numeric * 0.02
          + CASE
              WHEN al.published_at >= now() - INTERVAL '30 days' THEN 3.0
              WHEN al.published_at >= now() - INTERVAL '90 days' THEN 1.5
              ELSE 0.0
            END,
          4)
      ) AS row_data,
      COALESCE(alk.like_count, 0)::numeric * 0.5
      + COALESCE(asm.stream_count, 0)::numeric * 0.02
      + CASE
          WHEN al.published_at >= now() - INTERVAL '30 days' THEN 3.0
          WHEN al.published_at >= now() - INTERVAL '90 days' THEN 1.5
          ELSE 0.0
        END AS disc_score
    FROM public.albums al
    LEFT JOIN public.artist_profiles ap ON ap.creator_id = al.creator_id
    LEFT JOIN album_likes alk ON alk.album_id = al.id
    LEFT JOIN album_streams asm ON asm.album_id = al.id
    LEFT JOIN favorited_albums fa ON fa.album_id = al.id
    WHERE al.deleted_at IS NULL
      AND al.publication_status = 'published'
      AND fa.album_id IS NULL
    ORDER BY disc_score DESC
    LIMIT v_lim
  ) ranked;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

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
      COUNT(*) AS total_streams,
      COUNT(*) FILTER (WHERE ss.is_valid_listen = true) AS valid_streams
    FROM public.stream_sessions ss
    JOIN public.tracks t ON ss.track_id = t.id
    WHERE t.creator_id = p_creator_id AND t.deleted_at IS NULL
    GROUP BY ss.track_id
  ),
  track_likes AS (
    SELECT l.track_id, COUNT(*) AS like_count
    FROM public.likes l
    JOIN public.tracks t ON l.track_id = t.id
    WHERE t.creator_id = p_creator_id
      AND t.deleted_at IS NULL
    GROUP BY l.track_id
  ),
  ranked AS (
    SELECT
      t.id AS track_id,
      t.title,
      t.slug,
      t.album_id,
      a.title AS album_title,
      a.cover_path,
      t.duration_seconds,
      COALESCE(ts.valid_streams, 0) AS valid_streams,
      COALESCE(ts.total_streams, 0) AS total_streams,
      COALESCE(tl.like_count, 0) AS like_count,
      ROUND(
        (COALESCE(tl.like_count, 0) * 0.4
         + COALESCE(ts.valid_streams, 0) * 0.05)::NUMERIC, 2
      ) AS engagement_score,
      (COALESCE(ts.valid_streams, 0) * 0.6
       + COALESCE(tl.like_count, 0) * 0.4) AS rank_score
    FROM public.tracks t
    LEFT JOIN public.albums a ON t.album_id = a.id AND a.deleted_at IS NULL
    LEFT JOIN track_streams ts ON ts.track_id = t.id
    LEFT JOIN track_likes tl ON tl.track_id = t.id
    WHERE t.creator_id = p_creator_id
      AND t.publication_status = 'published'
      AND t.deleted_at IS NULL
    ORDER BY rank_score DESC
    LIMIT p_limit
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'track_id', r.track_id,
      'title', r.title,
      'slug', r.slug,
      'album_id', r.album_id,
      'album_title', r.album_title,
      'cover_path', r.cover_path,
      'duration_seconds', r.duration_seconds,
      'valid_streams', r.valid_streams,
      'total_streams', r.total_streams,
      'like_count', r.like_count,
      'engagement_score', r.engagement_score
    )
    ORDER BY r.rank_score DESC
  ) INTO v_result
  FROM ranked r;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_creator_audience_stats(p_creator_id UUID)
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

  SELECT COUNT(*)::INTEGER INTO v_artist_followers
  FROM public.follows
  WHERE entity_type = 'artist' AND entity_id = p_creator_id;

  SELECT COUNT(*)::INTEGER INTO v_creator_followers
  FROM public.follows
  WHERE entity_type = 'creator' AND entity_id = p_creator_id;

  SELECT COUNT(*)::INTEGER INTO v_new_followers_7d
  FROM public.follows
  WHERE entity_id = p_creator_id
    AND entity_type IN ('artist', 'creator')
    AND created_at >= now() - INTERVAL '7 days';

  SELECT COUNT(*)::INTEGER INTO v_new_followers_30d
  FROM public.follows
  WHERE entity_id = p_creator_id
    AND entity_type IN ('artist', 'creator')
    AND created_at >= now() - INTERVAL '30 days';

  SELECT COUNT(*)::INTEGER INTO v_track_likes
  FROM public.likes l
  JOIN public.tracks t ON t.id = l.track_id
  WHERE t.creator_id = p_creator_id
    AND t.deleted_at IS NULL;

  SELECT COUNT(*)::INTEGER INTO v_album_favorites
  FROM public.favorites f
  JOIN public.albums a ON a.id = f.entity_id
  WHERE f.entity_type = 'album'
    AND a.creator_id = p_creator_id
    AND a.deleted_at IS NULL;

  SELECT COUNT(*)::INTEGER INTO v_playlist_followers
  FROM public.follows f
  JOIN public.playlists pl ON pl.id = f.entity_id
  JOIN public.creators c ON c.owner_id = pl.user_id
  WHERE f.entity_type = 'playlist'
    AND c.id = p_creator_id
    AND pl.deleted_at IS NULL;

  RETURN jsonb_build_object(
    'total_followers', v_artist_followers + v_creator_followers,
    'artist_followers', v_artist_followers,
    'creator_followers', v_creator_followers,
    'new_followers_7d', v_new_followers_7d,
    'new_followers_30d', v_new_followers_30d,
    'total_track_likes', v_track_likes,
    'total_album_favorites', v_album_favorites,
    'playlist_followers', v_playlist_followers,
    'total_engagement', v_track_likes + v_album_favorites
      + v_artist_followers + v_creator_followers + v_playlist_followers,
    'engagement_score', ROUND(
      (v_track_likes * 0.4 + v_album_favorites * 0.3
       + (v_artist_followers + v_creator_followers) * 0.2
       + v_playlist_followers * 0.1)::NUMERIC, 2)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_discovery_feed FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_discovery_feed TO authenticated, anon;
REVOKE ALL ON FUNCTION public.get_suggested_albums FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_suggested_albums TO authenticated, anon;
REVOKE ALL ON FUNCTION public.get_creator_top_tracks FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_top_tracks TO authenticated;
REVOKE ALL ON FUNCTION public.get_creator_audience_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_audience_stats TO authenticated;

COMMIT;
