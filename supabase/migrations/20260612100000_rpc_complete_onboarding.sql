-- RPC SECURITY DEFINER : complete_onboarding
-- ---------------------------------------------------------------------------
-- Remplace le UPDATE direct depuis le browser sur la table profiles.
-- Avantages :
--   1. Utilise auth.uid() côté serveur — impossible à falsifier
--   2. Update profile + assign role en une seule transaction atomique
--   3. Évite toute dépendance aux GRANTs UPDATE côté client
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_full_name  TEXT,
  p_account_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile  JSONB;
BEGIN
  -- Récupérer l'utilisateur courant (JWT)
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  -- Valider le type de compte
  IF p_account_type NOT IN ('auditeur', 'artiste', 'auditeur_artiste') THEN
    RAISE EXCEPTION 'invalid_account_type: %', p_account_type USING ERRCODE = '22023';
  END IF;

  -- Valider le nom complet
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'full_name_required' USING ERRCODE = '22023';
  END IF;

  -- Mettre à jour le profil
  UPDATE public.profiles
  SET
    full_name           = trim(p_full_name),
    account_type        = p_account_type,
    onboarding_completed = true,
    updated_by          = v_user_id,
    updated_at          = now()
  WHERE id = v_user_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Assigner le rôle correspondant dans user_roles
  PERFORM public.assign_role_for_account_type(v_user_id, p_account_type, v_user_id);

  -- Retourner le profil mis à jour
  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

  -- Tracer l'action
  PERFORM public.log_audit_event(
    v_user_id,
    'auth.onboarding.completed',
    'profiles',
    v_user_id,
    jsonb_build_object(
      'account_type', p_account_type,
      'full_name',    trim(p_full_name)
    )
  );

  RETURN v_profile;
END;
$$;

-- Accessible aux utilisateurs authentifiés uniquement
REVOKE ALL ON FUNCTION public.complete_onboarding(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT, TEXT) TO authenticated;
