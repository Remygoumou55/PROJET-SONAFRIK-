-- Sprint 5.2 — Social & Engagement OS
-- follows · toggle_follow · is_following · get_follow_count
-- get_like_count · get_engagement_stats · get_creator_engagement_stats
-- Likes = favorites (entity_type='track') — réutilise l'infra Sprint 6
-- Follows = nouvelle table polymorphique (artist/creator/playlist)

-- ---------------------------------------------------------------------------
-- Table follows — polymorphique
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT        NOT NULL CHECK (entity_type IN ('artist', 'creator', 'playlist')),
  entity_id   UUID        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_entity
  ON public.follows(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follows_follower
  ON public.follows(follower_id, created_at DESC);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- DROP IF EXISTS pour idempotence (évite SQLSTATE 42710 sur ré-application Supabase Preview)
DROP POLICY IF EXISTS "follows_select_authenticated" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;

-- Lecture : les utilisateurs authentifiés voient tous les follows (pour les compteurs)
CREATE POLICY IF NOT EXISTS "follows_select_authenticated" ON public.follows
  FOR SELECT TO authenticated USING (true);

-- Insertion : uniquement pour soi-même
CREATE POLICY IF NOT EXISTS "follows_insert_own" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

-- Suppression : uniquement pour soi-même
CREATE POLICY IF NOT EXISTS "follows_delete_own" ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
-- RPC toggle_follow — suit ou arrête de suivre une entité
-- Retourne TRUE si maintenant suivi, FALSE si unfollow
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.toggle_follow(
  p_entity_type TEXT,
  p_entity_id   UUID
)
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
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non authentifié.'; END IF;

  IF p_entity_type NOT IN ('artist', 'creator', 'playlist') THEN
    RAISE EXCEPTION 'Type entité invalide.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = v_user_id
      AND entity_type = p_entity_type
      AND entity_id   = p_entity_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.follows
    WHERE follower_id = v_user_id
      AND entity_type = p_entity_type
      AND entity_id   = p_entity_id;
    RETURN false;
  ELSE
    INSERT INTO public.follows(follower_id, entity_type, entity_id)
    VALUES (v_user_id, p_entity_type, p_entity_id)
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_follow FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_follow TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC is_following — vérifie si l'utilisateur courant suit une entité
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_following(
  p_entity_type TEXT,
  p_entity_id   UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = auth.uid()
      AND entity_type = p_entity_type
      AND entity_id   = p_entity_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_following FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_following TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC get_follow_count — nombre de followers pour une entité
-- Accessible à tous (compteurs publics)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_follow_count(
  p_entity_type TEXT,
  p_entity_id   UUID
)
RETURNS INTEGER
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.follows
  WHERE entity_type = p_entity_type
    AND entity_id   = p_entity_id;
$$;

REVOKE ALL ON FUNCTION public.get_follow_count FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_follow_count TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- RPC get_like_count — nombre de likes d'un morceau
-- Like = favorite avec entity_type = 'track' (infra Sprint 6)
-- Accessible à tous (compteurs publics)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_like_count(
  p_track_id UUID
)
RETURNS INTEGER
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.favorites
  WHERE entity_type = 'track'
    AND entity_id   = p_track_id;
$$;

REVOKE ALL ON FUNCTION public.get_like_count FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_like_count TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- RPC get_engagement_stats — stats d'engagement unifiées pour une entité
-- Retourne : like_count, follow_count, user_liked, user_favorited, user_following
-- Utilisé par : Discovery Engine, Recommendation V2, UI contextuelle
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

  -- ── Track : likes = favorites entity_type='track' ──────────────────────
  IF p_entity_type = 'track' THEN
    SELECT COUNT(*)::integer INTO v_like_count
    FROM public.favorites
    WHERE entity_type = 'track' AND entity_id = p_entity_id;

    IF v_uid IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM public.favorites
        WHERE user_id = v_uid AND entity_type = 'track' AND entity_id = p_entity_id
      ) INTO v_user_liked;
      v_user_favorited := v_user_liked;
    END IF;

  -- ── Album / artist / playlist : favoris ────────────────────────────────
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

  -- ── Follows (artist / creator / playlist) ──────────────────────────────
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
-- RPC get_creator_engagement_stats — métriques d'engagement agrégées
-- Pour : Creator Analytics, Recommendation Engine V2, Creator OS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_creator_engagement_stats(
  p_creator_id UUID
)
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
  -- Likes sur les tracks du créateur
  SELECT COUNT(*)::integer INTO v_track_likes
  FROM public.favorites f
  JOIN public.tracks t ON t.id = f.entity_id
  WHERE f.entity_type = 'track'
    AND t.creator_id = p_creator_id
    AND t.deleted_at IS NULL;

  -- Favoris sur les albums du créateur
  SELECT COUNT(*)::integer INTO v_album_favorites
  FROM public.favorites f
  JOIN public.albums a ON a.id = f.entity_id
  WHERE f.entity_type = 'album'
    AND a.creator_id = p_creator_id
    AND a.deleted_at IS NULL;

  -- Abonnés artiste
  SELECT COUNT(*)::integer INTO v_artist_followers
  FROM public.follows
  WHERE entity_type = 'artist' AND entity_id = p_creator_id;

  -- Abonnés créateur
  SELECT COUNT(*)::integer INTO v_creator_followers
  FROM public.follows
  WHERE entity_type = 'creator' AND entity_id = p_creator_id;

  -- Abonnés playlists du créateur (via owner_id)
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
