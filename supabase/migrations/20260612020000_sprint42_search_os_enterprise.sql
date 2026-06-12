-- Sprint 4.2 — Search OS Enterprise
-- pg_trgm · unaccent · index GIN fonctionnels · search_catalog RPC
-- Recherche unifiée accent-insensitive + typo-tolerant + classement pertinence

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
-- Fonction unaccent IMMUTABLE pour les index fonctionnels
-- La forme unaccent('unaccent', text) est portable et schema-indépendante.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.f_unaccent(TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
SET search_path = public, extensions, pg_catalog
AS $$ SELECT unaccent($1) $$;

REVOKE ALL ON FUNCTION public.f_unaccent FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.f_unaccent TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- Index GIN trigram sur champs texte normalisés (accent-insensitive)
-- Les index partiels ne couvrent que les entités accessibles publiquement.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_tracks_title_search
  ON public.tracks
  USING GIN (lower(public.f_unaccent(title)) gin_trgm_ops)
  WHERE deleted_at IS NULL AND publication_status = 'published';

CREATE INDEX IF NOT EXISTS idx_albums_title_search
  ON public.albums
  USING GIN (lower(public.f_unaccent(title)) gin_trgm_ops)
  WHERE deleted_at IS NULL AND publication_status = 'published';

CREATE INDEX IF NOT EXISTS idx_artist_profiles_stage_name_search
  ON public.artist_profiles
  USING GIN (lower(public.f_unaccent(stage_name)) gin_trgm_ops)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_labels_name_search
  ON public.labels
  USING GIN (lower(public.f_unaccent(name)) gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- RPC search_catalog — Search OS Enterprise
-- • Accent-insensitive via f_unaccent
-- • Typo-tolerant via pg_trgm similarity
-- • Classement pertinence : exact > prefix > substring > trigram
-- • Enrichissement : artist_name sur tracks et albums
-- • Résultats : tracks + albums + artistes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_catalog(
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q       TEXT;
  v_lim     INTEGER;
  v_tracks  JSONB;
  v_albums  JSONB;
  v_artists JSONB;
BEGIN
  v_q   := lower(public.f_unaccent(trim(p_query)));
  v_lim := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);

  IF length(v_q) < 1 THEN
    RETURN jsonb_build_object(
      'tracks',  '[]'::jsonb,
      'albums',  '[]'::jsonb,
      'artists', '[]'::jsonb
    );
  END IF;

  -- Tracks avec enrichissement artiste + album, classés par pertinence
  SELECT COALESCE(jsonb_agg(t_obj ORDER BY t_score DESC, t_title), '[]'::jsonb)
  INTO v_tracks
  FROM (
    SELECT
      jsonb_build_object(
        'id',                 t.id,
        'creator_id',         t.creator_id,
        'album_id',           t.album_id,
        'title',              t.title,
        'slug',               t.slug,
        'track_number',       t.track_number,
        'isrc',               t.isrc,
        'duration_seconds',   t.duration_seconds,
        'explicit',           t.explicit,
        'language',           t.language,
        'bpm',                t.bpm,
        'musical_key',        t.musical_key,
        'publication_status', t.publication_status,
        'rejection_reason',   t.rejection_reason,
        'submitted_at',       t.submitted_at,
        'published_at',       t.published_at,
        'metadata',           t.metadata,
        'created_at',         t.created_at,
        'updated_at',         t.updated_at,
        'deleted_at',         t.deleted_at,
        'artist_name',        ap.stage_name,
        'album_title',        a.title
      ) AS t_obj,
      t.title AS t_title,
      GREATEST(
        CASE
          WHEN lower(public.f_unaccent(t.title)) = v_q                              THEN 1.00
          WHEN lower(public.f_unaccent(t.title)) LIKE v_q || '%'                    THEN 0.92
          WHEN lower(public.f_unaccent(t.title)) LIKE '%' || v_q || '%'             THEN 0.82
          ELSE similarity(lower(public.f_unaccent(t.title)), v_q)
        END,
        -- Bonus si l'artiste correspond à la requête
        CASE
          WHEN lower(public.f_unaccent(COALESCE(ap.stage_name, ''))) LIKE '%' || v_q || '%'
               THEN 0.72
          ELSE similarity(lower(public.f_unaccent(COALESCE(ap.stage_name, ''))), v_q) * 0.80
        END
      ) AS t_score
    FROM public.tracks t
    LEFT JOIN public.artist_profiles ap ON ap.creator_id = t.creator_id
    LEFT JOIN public.albums           a  ON a.id = t.album_id AND a.deleted_at IS NULL
    WHERE t.deleted_at IS NULL
      AND t.publication_status = 'published'
      AND (
           lower(public.f_unaccent(t.title))                            LIKE '%' || v_q || '%'
        OR lower(public.f_unaccent(COALESCE(ap.stage_name, '')))        LIKE '%' || v_q || '%'
        OR similarity(lower(public.f_unaccent(t.title)), v_q)           > 0.15
        OR similarity(lower(public.f_unaccent(COALESCE(ap.stage_name, ''))), v_q) > 0.15
      )
    LIMIT v_lim
  ) tracks_ranked;

  -- Albums avec enrichissement artiste, classés par pertinence
  SELECT COALESCE(jsonb_agg(a_obj ORDER BY a_score DESC, a_title), '[]'::jsonb)
  INTO v_albums
  FROM (
    SELECT
      jsonb_build_object(
        'id',                 al.id,
        'creator_id',         al.creator_id,
        'label_id',           al.label_id,
        'title',              al.title,
        'slug',               al.slug,
        'release_type',       al.release_type,
        'upc',                al.upc,
        'description',        al.description,
        'cover_path',         al.cover_path,
        'release_date',       al.release_date,
        'publication_status', al.publication_status,
        'rejection_reason',   al.rejection_reason,
        'submitted_at',       al.submitted_at,
        'published_at',       al.published_at,
        'metadata',           al.metadata,
        'created_at',         al.created_at,
        'updated_at',         al.updated_at,
        'deleted_at',         al.deleted_at,
        'artist_name',        ap.stage_name
      ) AS a_obj,
      al.title AS a_title,
      CASE
        WHEN lower(public.f_unaccent(al.title)) = v_q                          THEN 1.00
        WHEN lower(public.f_unaccent(al.title)) LIKE v_q || '%'                THEN 0.92
        WHEN lower(public.f_unaccent(al.title)) LIKE '%' || v_q || '%'         THEN 0.82
        ELSE similarity(lower(public.f_unaccent(al.title)), v_q)
      END AS a_score
    FROM public.albums al
    LEFT JOIN public.artist_profiles ap ON ap.creator_id = al.creator_id
    WHERE al.deleted_at IS NULL
      AND al.publication_status = 'published'
      AND (
           lower(public.f_unaccent(al.title)) LIKE '%' || v_q || '%'
        OR similarity(lower(public.f_unaccent(al.title)), v_q) > 0.15
      )
    LIMIT v_lim
  ) albums_ranked;

  -- Artistes publics avec créateurs actifs
  SELECT COALESCE(jsonb_agg(ar_obj ORDER BY ar_score DESC, ar_name), '[]'::jsonb)
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
        'verified',    ap.verified
      ) AS ar_obj,
      ap.stage_name AS ar_name,
      CASE
        WHEN lower(public.f_unaccent(ap.stage_name)) = v_q                      THEN 1.00
        WHEN lower(public.f_unaccent(ap.stage_name)) LIKE v_q || '%'            THEN 0.92
        WHEN lower(public.f_unaccent(ap.stage_name)) LIKE '%' || v_q || '%'     THEN 0.82
        ELSE similarity(lower(public.f_unaccent(ap.stage_name)), v_q)
      END AS ar_score
    FROM public.artist_profiles ap
    INNER JOIN public.creators c
      ON c.id = ap.creator_id
      AND c.deleted_at IS NULL
      AND c.status = 'active'
    WHERE ap.is_public = true
      AND (
           lower(public.f_unaccent(ap.stage_name)) LIKE '%' || v_q || '%'
        OR similarity(lower(public.f_unaccent(ap.stage_name)), v_q) > 0.15
      )
    LIMIT v_lim
  ) artists_ranked;

  RETURN jsonb_build_object(
    'tracks',  v_tracks,
    'albums',  v_albums,
    'artists', v_artists
  );
END;
$$;

REVOKE ALL ON FUNCTION public.search_catalog FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_catalog TO authenticated, anon;
