-- Vague C1 — Séparation sémantique likes (engagement) vs favoris (bibliothèque)
-- Avant : toggleLike appelait toggle_favorite → like = entrée bibliothèque
-- Après : table likes dédiée + RPC toggle_like / is_liked

BEGIN;

-- ---------------------------------------------------------------------------
-- Table likes — engagement track (distinct de favorites bibliothèque)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id   UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_track ON public.likes(track_id);
CREATE INDEX IF NOT EXISTS idx_likes_user  ON public.likes(user_id, created_at DESC);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_own" ON public.likes;
CREATE POLICY "likes_select_own" ON public.likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "likes_insert_own" ON public.likes;
CREATE POLICY "likes_insert_own" ON public.likes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "likes_delete_own" ON public.likes;
CREATE POLICY "likes_delete_own" ON public.likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Historique : migrer uniquement les favoris track dont le morceau existe encore
INSERT INTO public.likes (user_id, track_id, created_at)
SELECT f.user_id, f.entity_id, f.created_at
FROM public.favorites f
INNER JOIN public.tracks t ON t.id = f.entity_id
WHERE f.entity_type = 'track'
ON CONFLICT (user_id, track_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RPC toggle_like / is_liked
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_like(p_track_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_exists  BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.likes
    WHERE user_id = v_user_id AND track_id = p_track_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.likes
    WHERE user_id = v_user_id AND track_id = p_track_id;
    RETURN false;
  END IF;

  INSERT INTO public.likes (user_id, track_id)
  VALUES (v_user_id, p_track_id)
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_like FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_like TO authenticated;

CREATE OR REPLACE FUNCTION public.is_liked(p_track_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.likes
    WHERE user_id = auth.uid() AND track_id = p_track_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_liked FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_liked TO authenticated;

-- ---------------------------------------------------------------------------
-- get_like_count — source unique : table likes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_like_count(p_track_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.likes
  WHERE track_id = p_track_id;
$$;

REVOKE ALL ON FUNCTION public.get_like_count FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_like_count TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- get_engagement_stats — user_liked ≠ user_favorited pour les tracks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_engagement_stats(
  p_entity_type TEXT,
  p_entity_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_like_count     INTEGER := 0;
  v_fav_count      INTEGER := 0;
  v_follow_count   INTEGER := 0;
  v_user_liked     BOOLEAN := false;
  v_user_favorited BOOLEAN := false;
  v_user_following BOOLEAN := false;
  v_uid            UUID;
BEGIN
  v_uid := auth.uid();

  IF p_entity_type = 'track' THEN
    SELECT COUNT(*)::integer INTO v_like_count
    FROM public.likes
    WHERE track_id = p_entity_id;

    SELECT COUNT(*)::integer INTO v_fav_count
    FROM public.favorites
    WHERE entity_type = 'track' AND entity_id = p_entity_id;

    IF v_uid IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM public.likes
        WHERE user_id = v_uid AND track_id = p_entity_id
      ) INTO v_user_liked;

      SELECT EXISTS(
        SELECT 1 FROM public.favorites
        WHERE user_id = v_uid AND entity_type = 'track' AND entity_id = p_entity_id
      ) INTO v_user_favorited;
    END IF;

  ELSIF p_entity_type IN ('album', 'artist', 'playlist') THEN
    SELECT COUNT(*)::integer INTO v_fav_count
    FROM public.favorites
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

    IF v_uid IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM public.favorites
        WHERE user_id = v_uid AND entity_type = p_entity_type AND entity_id = p_entity_id
      ) INTO v_user_favorited;
    END IF;
  END IF;

  IF p_entity_type IN ('artist', 'creator', 'playlist') THEN
    SELECT COUNT(*)::integer INTO v_follow_count
    FROM public.follows
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

    IF v_uid IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM public.follows
        WHERE follower_id = v_uid AND entity_type = p_entity_type AND entity_id = p_entity_id
      ) INTO v_user_following;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'like_count',     CASE WHEN p_entity_type = 'track' THEN v_like_count ELSE v_fav_count END,
    'follow_count',   v_follow_count,
    'user_liked',     v_user_liked,
    'user_favorited', v_user_favorited,
    'user_following', v_user_following
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_engagement_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_engagement_stats TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- get_creator_engagement_stats — track_likes depuis likes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_creator_engagement_stats(p_creator_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_track_likes        INTEGER := 0;
  v_album_favorites    INTEGER := 0;
  v_artist_followers   INTEGER := 0;
  v_creator_followers  INTEGER := 0;
  v_playlist_followers INTEGER := 0;
BEGIN
  SELECT COUNT(*)::integer INTO v_track_likes
  FROM public.likes l
  JOIN public.tracks t ON t.id = l.track_id
  WHERE t.creator_id = p_creator_id
    AND t.deleted_at IS NULL;

  SELECT COUNT(*)::integer INTO v_album_favorites
  FROM public.favorites f
  JOIN public.albums a ON a.id = f.entity_id
  WHERE f.entity_type = 'album'
    AND a.creator_id = p_creator_id
    AND a.deleted_at IS NULL;

  SELECT COUNT(*)::integer INTO v_artist_followers
  FROM public.follows
  WHERE entity_type = 'artist' AND entity_id = p_creator_id;

  SELECT COUNT(*)::integer INTO v_creator_followers
  FROM public.follows
  WHERE entity_type = 'creator' AND entity_id = p_creator_id;

  SELECT COUNT(*)::integer INTO v_playlist_followers
  FROM public.follows f
  JOIN public.playlists pl ON pl.id = f.entity_id
  JOIN public.creators c   ON c.owner_id = pl.user_id
  WHERE f.entity_type = 'playlist'
    AND c.id = p_creator_id
    AND pl.deleted_at IS NULL;

  RETURN jsonb_build_object(
    'track_likes',        v_track_likes,
    'album_favorites',    v_album_favorites,
    'artist_followers',   v_artist_followers,
    'creator_followers',  v_creator_followers,
    'playlist_followers', v_playlist_followers,
    'total_engagement',   v_track_likes + v_album_favorites + v_artist_followers
                          + v_creator_followers + v_playlist_followers
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_creator_engagement_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_engagement_stats TO authenticated;

COMMIT;
