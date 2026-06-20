-- Migration : playlists_private_by_default
-- CONTEXTE : la colonne is_public (DEFAULT false) existe déjà dans sprint6_streaming_os.sql.
-- Cette migration ajoute le commentaire documentaire et harmonise les noms des politiques RLS.
-- À exécuter manuellement dans Supabase SQL Editor par Mr Rémy — NE PAS COMMITTER SANS VALIDATION.

-- Commentaire documentaire sur la colonne
COMMENT ON COLUMN public.playlists.is_public IS
  'Visibilité de la playlist. FALSE par défaut = privée. L''utilisateur doit explicitement choisir de la rendre publique.';

-- Harmonisation des politiques RLS : suppression des anciennes (nommage sprint6)
-- puis recréation avec le nommage normalisé.
-- Les droits des playlists existantes sont préservés (aucune modification de données).

-- Politique SELECT : playlists publiques + propres playlists + admins
DROP POLICY IF EXISTS "playlists_select" ON public.playlists;
DROP POLICY IF EXISTS "playlists_select_policy" ON public.playlists;

CREATE POLICY IF NOT EXISTS "playlists_select_policy"
  ON public.playlists FOR SELECT
  USING (
    is_public = TRUE
    OR auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

-- Politique UPDATE : seul le propriétaire peut modifier sa playlist (y compris sa visibilité)
DROP POLICY IF EXISTS "playlists_update" ON public.playlists;
DROP POLICY IF EXISTS "playlists_update_policy" ON public.playlists;

CREATE POLICY IF NOT EXISTS "playlists_update_policy"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = user_id);
