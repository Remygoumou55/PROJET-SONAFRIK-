-- Sprint 1.2 — Artist Journey Recovery
-- ---------------------------------------------------------------------------
-- P0 : GRANTs table-level manquants sur le catalogue créateur.
--      La migration 20260612090000_fix_table_grants n'accordait que SELECT ;
--      les INSERT/UPDATE client échouaient avec "permission denied" avant RLS.
--      La sécurité reste assurée par les politiques RLS (can_edit_creator, etc.).
--
-- P0 : complete_onboarding provisionne creators + artist_profiles pour les
--      comptes artiste / auditeur_artiste via ensure_creator_for_current_user().
-- ---------------------------------------------------------------------------

-- ── GRANTs catalogue créateur (authenticated) ─────────────────────────────

GRANT SELECT, INSERT, UPDATE ON public.albums TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tracks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.track_files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.album_genres TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.track_genres TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.artist_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.creator_verifications TO authenticated;

-- anon : lecture publique inchangée (SELECT déjà accordé)
GRANT SELECT ON public.albums TO anon;
GRANT SELECT ON public.tracks TO anon;
GRANT SELECT ON public.album_genres TO anon;
GRANT SELECT ON public.track_genres TO anon;
GRANT SELECT ON public.artist_profiles TO anon;
GRANT SELECT ON public.creator_verifications TO anon;

-- ── complete_onboarding : provisioning Creator OS ─────────────────────────

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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  IF p_account_type NOT IN ('auditeur', 'artiste', 'auditeur_artiste') THEN
    RAISE EXCEPTION 'invalid_account_type: %', p_account_type USING ERRCODE = '22023';
  END IF;

  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'full_name_required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET
    full_name            = trim(p_full_name),
    account_type         = p_account_type,
    onboarding_completed = true,
    updated_by           = v_user_id,
    updated_at           = now()
  WHERE id = v_user_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public.assign_role_for_account_type(v_user_id, p_account_type, v_user_id);

  -- Sprint 1.2 : tout compte artiste doit avoir creators + artist_profiles
  -- avant le premier accès catalogue (évite permission denied / can_edit_creator).
  IF p_account_type IN ('artiste', 'auditeur_artiste') THEN
    PERFORM public.ensure_creator_for_current_user();
  END IF;

  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

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

REVOKE ALL ON FUNCTION public.complete_onboarding(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT, TEXT) TO authenticated;
