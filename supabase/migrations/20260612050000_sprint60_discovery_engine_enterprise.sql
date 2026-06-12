-- Sprint 6.0 — Discovery Engine Enterprise
-- get_discovery_feed · get_new_releases · get_suggested_artists · get_suggested_albums
-- Discovery Score : recency × engagement × diversité artiste × social signals
-- Toutes les fonctions : SECURITY DEFINER, CTEs anti-N+1, < 200 ms

-- ---------------------------------------------------------------------------
-- Index supplémentaires pour le Discovery Engine
-- ---------------------------------------------------------------------------

-- Index sur published_at pour les requêtes "Nouveautés"
CREATE INDEX IF NOT EXISTS idx_tracks_published_at
  ON public.tracks(published_at DESC)
  WHERE deleted_at IS NULL AND publication_status = 'published';

CREATE INDEX IF NOT EXISTS idx_albums_published_at
  ON public.albums(published_at DESC)
  WHERE deleted_at IS NULL AND publication_status = 'published';

-- Index sur artist_profiles.created_at pour les nouveaux artistes
CREATE INDEX IF NOT EXISTS idx_artist_profiles_created_at
  ON public.artist_profiles(created_at DESC)
  WHERE is_public = true;

-- Index sur favorites.entity_type + entity_id pour les like counts
CREATE INDEX IF NOT EXISTS idx_favorites_entity_counts
  ON public.favorites(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- RPC get_discovery_feed — Section "Découvertes"
-- Score = engagement × recency × bonus diversité artiste (anti-bulle)
-- CTEs pour éviter les N+1 : user_artist_history, user_recent_tracks,
--   track_likes, track_streams
-- Accessible : authenticated + anon (CTEs filtrent sur NULL uid)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_discovery_feed(
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
  v_lim     := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);

  WITH
  -- Artistes déjà entendus par l'utilisateur (bonus diversité si absent)
  user_artist_history AS (
    SELECT DISTINCT t.creator_id
    FROM public.stream_sessions ss
    JOIN public.tracks t ON t.id = ss.track_id
    WHERE v_user_id IS NOT NULL
      AND ss.user_id = v_user_id
      AND ss.started_at >= now() - INTERVAL '30 days'
  ),
  -- Tracks récemment entendus (à exclure du feed)
  user_recent_tracks AS (
    SELECT DISTINCT track_id
    FROM public.stream_sessions
    WHERE v_user_id IS NOT NULL
      AND user_id = v_user_id
      AND started_at >= now() - INTERVAL '14 days'
  ),
  -- Like counts par track
  track_likes AS (
    SELECT entity_id AS track_id, COUNT(*)::integer AS like_count
    FROM public.favorites
    WHERE entity_type = 'track'
    GROUP BY entity_id
  ),
  -- Stream counts (7 derniers jours)
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
          -- Bonus diversité : artiste non encore entendu par l'utilisateur
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
    LEFT JOIN track_likes     lc  ON lc.track_id  = t.id
    LEFT JOIN track_streams   sc  ON sc.track_id  = t.id
    LEFT JOIN user_recent_tracks urt ON urt.track_id  = t.id
    LEFT JOIN user_artist_history uah ON uah.creator_id = t.creator_id
    WHERE t.deleted_at IS NULL
      AND t.publication_status = 'published'
      AND urt.track_id IS NULL   -- pas encore entendu récemment
    ORDER BY disc_score DESC
    LIMIT v_lim
  ) ranked;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_discovery_feed FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_discovery_feed TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- RPC get_new_releases — Section "Nouveautés"
-- p_type : 'track' | 'album' | 'artist' | 'all'
-- p_days : fenêtre en jours (défaut 30)
-- Retourne JSONB { tracks, albums, artists }
-- ---------------------------------------------------------------------------

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

  -- ── Nouveaux morceaux ────────────────────────────────────────────────────
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
          'cover_path',       al.cover_path,
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

  -- ── Nouveaux albums ──────────────────────────────────────────────────────
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

  -- ── Nouveaux artistes ────────────────────────────────────────────────────
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
          'cover_path',  ap.cover_path,
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

REVOKE ALL ON FUNCTION public.get_new_releases FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_new_releases TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- RPC get_suggested_artists — "Artistes à découvrir"
-- Discovery Score = follower_count × 0.4 + stream_count × 0.01 + verified bonus
-- Exclut les artistes déjà suivis par auth.uid()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_suggested_artists(
  p_limit INTEGER DEFAULT 10
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
  v_lim     := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);

  WITH
  -- Follower counts par artiste
  artist_followers AS (
    SELECT entity_id AS creator_id, COUNT(*)::integer AS follow_count
    FROM public.follows
    WHERE entity_type = 'artist'
    GROUP BY entity_id
  ),
  -- Stream counts par artiste (30 jours)
  artist_streams AS (
    SELECT t.creator_id, COUNT(ss.id)::integer AS stream_count
    FROM public.stream_sessions ss
    JOIN public.tracks t ON t.id = ss.track_id
    WHERE ss.is_valid_listen = true
      AND ss.started_at >= now() - INTERVAL '30 days'
    GROUP BY t.creator_id
  ),
  -- Artistes déjà suivis par l'utilisateur courant
  already_followed AS (
    SELECT entity_id AS creator_id
    FROM public.follows
    WHERE v_user_id IS NOT NULL
      AND follower_id = v_user_id
      AND entity_type = 'artist'
  )
  SELECT COALESCE(jsonb_agg(row_data ORDER BY disc_score DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      jsonb_build_object(
        'creator_id',      ap.creator_id,
        'stage_name',      ap.stage_name,
        'slug',            ap.slug,
        'bio',             ap.bio,
        'genres',          ap.genres,
        'cover_path',      ap.cover_path,
        'verified',        ap.verified,
        'follower_count',  COALESCE(af.follow_count, 0),
        'stream_count',    COALESCE(as2.stream_count, 0),
        'discovery_score', ROUND(
          COALESCE(af.follow_count, 0)::numeric * 0.4
          + COALESCE(as2.stream_count, 0)::numeric * 0.01
          + CASE WHEN ap.verified THEN 5.0 ELSE 0.0 END,
          4)
      ) AS row_data,
      COALESCE(af.follow_count, 0)::numeric * 0.4
      + COALESCE(as2.stream_count, 0)::numeric * 0.01
      + CASE WHEN ap.verified THEN 5.0 ELSE 0.0 END AS disc_score
    FROM public.artist_profiles ap
    INNER JOIN public.creators c
      ON c.id = ap.creator_id
      AND c.deleted_at IS NULL
      AND c.status = 'active'
    LEFT JOIN artist_followers  af   ON af.creator_id  = ap.creator_id
    LEFT JOIN artist_streams    as2  ON as2.creator_id = ap.creator_id
    LEFT JOIN already_followed  afol ON afol.creator_id = ap.creator_id
    WHERE ap.is_public = true
      AND afol.creator_id IS NULL   -- non encore suivi
    ORDER BY disc_score DESC
    LIMIT v_lim
  ) ranked;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_suggested_artists FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_suggested_artists TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- RPC get_suggested_albums — "Albums recommandés"
-- Discovery Score = track_likes × 0.5 + stream_count × 0.02 + recency bonus
-- Exclut les albums déjà en favoris de auth.uid()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_suggested_albums(
  p_limit INTEGER DEFAULT 10
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
  v_lim     := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);

  WITH
  -- Likes agrégés sur les tracks de chaque album
  album_likes AS (
    SELECT t.album_id, COUNT(f.entity_id)::integer AS like_count
    FROM public.favorites f
    JOIN public.tracks t ON t.id = f.entity_id
    WHERE f.entity_type = 'track'
      AND t.album_id IS NOT NULL
      AND t.deleted_at IS NULL
    GROUP BY t.album_id
  ),
  -- Stream counts par album (30 jours)
  album_streams AS (
    SELECT t.album_id, COUNT(ss.id)::integer AS stream_count
    FROM public.stream_sessions ss
    JOIN public.tracks t ON t.id = ss.track_id
    WHERE ss.is_valid_listen = true
      AND ss.started_at >= now() - INTERVAL '30 days'
      AND t.album_id IS NOT NULL
    GROUP BY t.album_id
  ),
  -- Albums déjà en favoris de l'utilisateur courant
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
    LEFT JOIN album_likes    alk  ON alk.album_id   = al.id
    LEFT JOIN album_streams  asm  ON asm.album_id   = al.id
    LEFT JOIN favorited_albums fa ON fa.album_id    = al.id
    WHERE al.deleted_at IS NULL
      AND al.publication_status = 'published'
      AND fa.album_id IS NULL   -- pas encore en favoris
    ORDER BY disc_score DESC
    LIMIT v_lim
  ) ranked;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_suggested_albums FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_suggested_albums TO authenticated, anon;
