-- Sprint Admin 2 — colonnes modération profiles + RPCs actions admin

BEGIN;

-- ── Colonnes modération sur profiles ────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'banned', 'deleted')),
  ADD COLUMN IF NOT EXISTS warning_count INTEGER NOT NULL DEFAULT 0
    CHECK (warning_count >= 0),
  ADD COLUMN IF NOT EXISTS last_warning_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status
  ON public.profiles(account_status)
  WHERE deleted_at IS NULL;

-- Admin peut lire les sessions (dernière connexion)
DROP POLICY IF EXISTS user_sessions_select_admin ON public.user_sessions;
CREATE POLICY user_sessions_select_admin ON public.user_sessions
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ── RPC : Avertir un utilisateur ────────────────────────────────────────────
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
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

-- ── RPC : Suspendre un utilisateur ──────────────────────────────────────────
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
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

-- ── RPC : Suppression soft d'un utilisateur ─────────────────────────────────
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
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

-- ── RPC : Suspendre un créateur / artiste ───────────────────────────────────
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.creators
  WHERE id = p_creator_id AND deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Créateur introuvable';
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

-- ── RPC : Valider / refuser vérification artiste (par creator_id) ─────────────
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

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

-- ── RPC : Changer le tier d'un artiste ──────────────────────────────────────
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

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
GRANT EXECUTE ON FUNCTION public.admin_suspend_user(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_creator(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_artist(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_artist_tier(UUID, TEXT) TO authenticated;

COMMIT;
