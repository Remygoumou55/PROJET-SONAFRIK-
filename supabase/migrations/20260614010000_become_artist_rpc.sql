-- ============================================================================
-- D-5 Phase 1 — RPC become_artist_for_current_user()
-- ============================================================================
-- Permet à un utilisateur avec account_type = 'auditeur' de passer en
-- 'auditeur_artiste' en self-service, sans validation admin.
-- La vérification /creator/verification reste un badge optionnel séparé.
--
-- Fichier      : 20260614010000_become_artist_rpc.sql
-- Précédent    : 20260613020000_align_playlist_check_constraints.sql
-- Phase 2      : Frontend — après exécution et capture d'écran validée
-- ============================================================================

-- ---------------------------------------------------------------------------
-- REQUÊTES DE VÉRIFICATION PRÉALABLE
-- À lancer SÉPARÉMENT dans Supabase SQL Editor AVANT la fonction.
-- Copier chaque bloc SELECT dans un onglet séparé et cliquer Run.
-- ---------------------------------------------------------------------------

/*

-- VÉR. 1 — Répartition actuelle des types de compte
-- (estimez le nombre d'auditeurs éligibles à la transition)
SELECT
  account_type,
  COUNT(*) AS nb_profils,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM public.profiles
WHERE deleted_at IS NULL
GROUP BY account_type
ORDER BY nb_profils DESC;

-- VÉR. 2 — Incohérences existantes : auditeur avec un enregistrement creator
-- Doit retourner 0 ligne. Si des lignes apparaissent, investiguer avant
-- d'exécuter la fonction (cas de données corrompues à corriger manuellement).
SELECT
  p.id            AS profile_id,
  p.full_name,
  p.account_type,
  c.id            AS creator_id,
  c.created_at    AS creator_created_at
FROM public.profiles p
JOIN public.creators c ON c.owner_id = p.id AND c.deleted_at IS NULL
WHERE p.account_type = 'auditeur'
  AND p.deleted_at IS NULL;

*/

-- ---------------------------------------------------------------------------
-- FUNCTION : become_artist_for_current_user
-- ---------------------------------------------------------------------------
-- Flux atomique (transaction unique) :
--   1. Vérifier l'identité (auth.uid())
--   2. Lire account_type courant — idempotence si déjà artiste
--   3. UPDATE profiles : account_type → 'auditeur_artiste',
--                        onboarding_completed → true (sécurité bord)
--   4. PERFORM assign_role_for_account_type → INSERT user_roles
--   5. PERFORM ensure_creator_for_current_user() →
--        INSERT creators + creator_roles (owner) + artist_profiles
--        (stage_name = profiles.full_name, slug auto, ON CONFLICT SKIP)
--   6. PERFORM log_audit_event
--   7. RETURN JSONB profil mis à jour
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.become_artist_for_current_user()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID;
  v_account_type TEXT;
  v_profile      JSONB;
BEGIN
  -- 1. Identifier l'utilisateur courant via JWT
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autorisé — connexion requise.'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Lire l'état courant du profil
  SELECT account_type INTO v_account_type
  FROM public.profiles
  WHERE id = v_user_id
    AND deleted_at IS NULL;

  IF v_account_type IS NULL THEN
    RAISE EXCEPTION 'Profil introuvable.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 3. Idempotence : déjà artiste → exception métier lisible
  IF v_account_type IN ('artiste', 'auditeur_artiste') THEN
    RAISE EXCEPTION 'Vous êtes déjà artiste.'
      USING ERRCODE = '23505';
  END IF;

  -- 4. Passer le profil en « auditeur_artiste »
  --    auditeur_artiste = accès auditeur conservé + accès Creator OS activé.
  --    onboarding_completed forcé à true : sécurité bord pour les profils
  --    dont l'onboarding aurait été interrompu avant complétion.
  UPDATE public.profiles
  SET
    account_type         = 'auditeur_artiste',
    onboarding_completed = true,
    updated_by           = v_user_id,
    updated_at           = now()
  WHERE id = v_user_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Impossible de mettre à jour le profil.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 5. Ajouter le rôle auditeur_artiste dans user_roles
  --    (ON CONFLICT DO NOTHING dans assign_role_for_account_type → idempotent)
  --    Requis pour que les politiques RLS et has_permission() soient actives.
  PERFORM public.assign_role_for_account_type(
    v_user_id,
    'auditeur_artiste',
    v_user_id
  );

  -- 6. Provisionner Creator OS en transaction atomique :
  --    • INSERT creators (owner_id = v_user_id, status='draft', tier='emergent')
  --    • INSERT creator_roles (role='owner')
  --    • INSERT artist_profiles (stage_name = full_name, slug auto-généré)
  --    ensure_creator_for_current_user() est IDEMPOTENTE :
  --    si creators existe déjà, retourne l'id existant sans doublon.
  --    is_artist_account() retourne maintenant true grâce au UPDATE ci-dessus.
  PERFORM public.ensure_creator_for_current_user();

  -- 7. Tracer l'événement dans l'audit log
  PERFORM public.log_audit_event(
    v_user_id,
    'auth.became_artist',
    'profiles',
    v_user_id,
    jsonb_build_object(
      'previous_account_type', v_account_type,
      'new_account_type',      'auditeur_artiste'
    )
  );

  -- 8. Retourner le profil mis à jour au client
  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

  RETURN v_profile;
END;
$$;

-- Accessible uniquement aux utilisateurs authentifiés
REVOKE ALL ON FUNCTION public.become_artist_for_current_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.become_artist_for_current_user() TO authenticated;
