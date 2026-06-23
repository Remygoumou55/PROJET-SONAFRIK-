-- Sprint 1.2-B — fix assign_admin_role (service_role via Supabase client)

CREATE OR REPLACE FUNCTION public.assign_admin_role(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = p_user_id AND p.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = 'admin' AND deleted_at IS NULL
  LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'admin_role_not_found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.user_roles (user_id, role_id, assigned_by)
  VALUES (p_user_id, v_role_id, p_user_id)
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_admin_role(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_admin_role(UUID) TO service_role;
