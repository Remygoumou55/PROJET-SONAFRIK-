-- Admin mutations — autoriser service_role + session admin authentifiée
-- Symptôme : RPC review_track_publication / approve_payout_request échouent car
-- auth.uid() est NULL avec service_role (BYPASS_AUTH local) ou client service_role en prod.
-- Pattern : _is_privileged_admin() = service_role OU is_admin(auth.uid())

BEGIN;

CREATE OR REPLACE FUNCTION public._is_privileged_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    OR (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));
$$;

REVOKE ALL ON FUNCTION public._is_privileged_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._is_privileged_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public._is_privileged_admin() TO service_role;

CREATE OR REPLACE FUNCTION public._assert_admin()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_privileged_admin() THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public._assert_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._assert_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public._assert_admin() TO service_role;

-- ── Catalogue : revue album ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.review_album_publication(
  p_album_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._assert_admin();

  IF p_status NOT IN ('published', 'rejected') THEN
    RAISE EXCEPTION 'Statut invalide.' USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('app.catalog_review_publish', 'on', true);

  UPDATE public.albums
  SET publication_status = p_status,
      rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      published_at = CASE WHEN p_status = 'published' THEN now() ELSE published_at END,
      updated_by = auth.uid()
  WHERE id = p_album_id AND publication_status = 'pending_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Album non éligible à la revue.' USING ERRCODE = 'P0002';
  END IF;

  IF p_status = 'published' THEN
    UPDATE public.tracks
    SET publication_status = 'published',
        published_at = now(),
        updated_by = auth.uid()
    WHERE album_id = p_album_id
      AND publication_status IN ('draft', 'pending_review', 'published');
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'catalog.album.reviewed', 'albums', p_album_id, jsonb_build_object('status', p_status)
  );
END;
$$;

-- ── Catalogue : revue morceau ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.review_track_publication(
  p_track_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._assert_admin();

  IF p_status NOT IN ('published', 'rejected') THEN
    RAISE EXCEPTION 'Statut invalide.' USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('app.catalog_review_publish', 'on', true);

  UPDATE public.tracks
  SET publication_status = p_status,
      rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      published_at = CASE WHEN p_status = 'published' THEN now() ELSE published_at END,
      updated_by = auth.uid()
  WHERE id = p_track_id AND publication_status = 'pending_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Morceau non éligible à la revue.' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'catalog.track.reviewed', 'tracks', p_track_id, jsonb_build_object('status', p_status)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_album_publication(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_album_publication(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_track_publication(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_track_publication(UUID, TEXT, TEXT) TO service_role;

-- ── Modération utilisateurs / artistes (dernières versions) ───────────────────

CREATE OR REPLACE FUNCTION public.admin_warn_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Avertissement administrateur',
  p_admin_note TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._assert_admin();

  IF auth.uid() IS NOT NULL AND p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Action interdite sur votre propre compte';
  END IF;

  UPDATE public.profiles
  SET warning_count = COALESCE(warning_count, 0) + 1,
      last_warning_at = now(),
      updated_by = auth.uid()
  WHERE id = p_user_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'admin.user_warned',
    'profiles',
    p_user_id,
    jsonb_build_object('reason', p_reason, 'note', p_admin_note)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_suspend_user(
  p_user_id UUID,
  p_duration_days INTEGER DEFAULT 30,
  p_reason TEXT DEFAULT 'Suspension administrateur'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._assert_admin();

  IF auth.uid() IS NOT NULL AND p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Action interdite sur votre propre compte';
  END IF;

  IF p_duration_days < 1 OR p_duration_days > 3650 THEN
    RAISE EXCEPTION 'Durée de suspension invalide';
  END IF;

  UPDATE public.profiles
  SET account_status = 'suspended',
      suspended_until = now() + (p_duration_days || ' days')::interval,
      suspended_reason = p_reason,
      updated_by = auth.uid()
  WHERE id = p_user_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'admin.user_suspended',
    'profiles',
    p_user_id,
    jsonb_build_object('duration_days', p_duration_days, 'reason', p_reason)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Suppression définitive'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._assert_admin();

  IF auth.uid() IS NOT NULL AND p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Action interdite sur votre propre compte';
  END IF;

  UPDATE public.profiles
  SET deleted_at = now(),
      account_status = 'deleted',
      deletion_reason = p_reason,
      updated_by = auth.uid()
  WHERE id = p_user_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'admin.user_deleted',
    'profiles',
    p_user_id,
    jsonb_build_object('reason', p_reason)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_suspend_creator(
  p_creator_id UUID,
  p_reason TEXT DEFAULT 'Suspension administrateur'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  PERFORM public._assert_admin();

  SELECT owner_id INTO v_owner_id
  FROM public.creators
  WHERE id = p_creator_id AND deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Créateur introuvable';
  END IF;

  IF auth.uid() IS NOT NULL AND v_owner_id = auth.uid() THEN
    RAISE EXCEPTION 'Action interdite sur votre propre compte';
  END IF;

  UPDATE public.creators
  SET status = 'suspended',
      updated_by = auth.uid()
  WHERE id = p_creator_id;

  UPDATE public.profiles
  SET account_status = 'suspended',
      suspended_until = now() + interval '30 days',
      suspended_reason = p_reason,
      updated_by = auth.uid()
  WHERE id = v_owner_id
    AND deleted_at IS NULL;

  PERFORM public.log_audit_event_authenticated(
    'admin.creator_suspended',
    'creators',
    p_creator_id,
    jsonb_build_object('owner_id', v_owner_id, 'reason', p_reason)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_verify_artist(
  p_creator_id UUID,
  p_approved BOOLEAN,
  p_note TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verification_id UUID;
BEGIN
  PERFORM public._assert_admin();

  SELECT id INTO v_verification_id
  FROM public.creator_verifications
  WHERE creator_id = p_creator_id
    AND status = 'pending'
  ORDER BY submitted_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF v_verification_id IS NOT NULL THEN
    PERFORM public.review_creator_verification(
      v_verification_id,
      CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
      CASE WHEN p_approved THEN NULL ELSE COALESCE(NULLIF(p_note, ''), 'Refus administrateur') END
    );
    RETURN;
  END IF;

  IF p_approved THEN
    UPDATE public.artist_profiles
    SET verified = true,
        verified_at = now(),
        updated_by = auth.uid()
    WHERE creator_id = p_creator_id;

    UPDATE public.creators
    SET status = 'active',
        updated_by = auth.uid()
    WHERE id = p_creator_id
      AND deleted_at IS NULL;

    PERFORM public.log_audit_event_authenticated(
      'admin.artist_verified',
      'creators',
      p_creator_id,
      jsonb_build_object('approved', true, 'note', p_note, 'direct', true)
    );
  ELSE
    PERFORM public.log_audit_event_authenticated(
      'admin.artist_rejected',
      'creators',
      p_creator_id,
      jsonb_build_object('approved', false, 'note', p_note, 'direct', true)
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_artist_tier(
  p_creator_id UUID,
  p_new_tier TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_tier TEXT;
BEGIN
  PERFORM public._assert_admin();

  IF p_new_tier NOT IN ('emergent', 'croissance', 'etabli') THEN
    RAISE EXCEPTION 'Tier invalide : %', p_new_tier;
  END IF;

  SELECT tier INTO v_old_tier
  FROM public.creators
  WHERE id = p_creator_id AND deleted_at IS NULL;

  IF v_old_tier IS NULL THEN
    RAISE EXCEPTION 'Créateur introuvable';
  END IF;

  UPDATE public.creators
  SET tier = p_new_tier,
      updated_by = auth.uid()
  WHERE id = p_creator_id;

  PERFORM public.log_audit_event_authenticated(
    'admin.artist_tier_changed',
    'creators',
    p_creator_id,
    jsonb_build_object('old_tier', v_old_tier, 'new_tier', p_new_tier)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_warn_user(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_warn_user(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_suspend_user(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_user(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_suspend_creator(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_creator(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_verify_artist(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_artist(UUID, BOOLEAN, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_change_artist_tier(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_artist_tier(UUID, TEXT) TO service_role;

COMMIT;
