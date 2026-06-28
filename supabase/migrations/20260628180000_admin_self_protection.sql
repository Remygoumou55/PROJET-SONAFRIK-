-- Re-audit Admin 2 — interdire modération sur son propre compte

BEGIN;

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

  IF p_user_id = auth.uid() THEN
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  IF p_user_id = auth.uid() THEN
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  IF p_user_id = auth.uid() THEN
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.creators
  WHERE id = p_creator_id AND deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Créateur introuvable';
  END IF;

  IF v_owner_id = auth.uid() THEN
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

COMMIT;
