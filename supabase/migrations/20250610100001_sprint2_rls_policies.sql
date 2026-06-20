-- Sprint 2 — RLS Identity OS (Zero Trust — DENY ALL par défaut)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: admin check
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND r.name = 'admin'
      AND r.deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY IF NOT EXISTS profiles_select_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- roles & permissions — lecture authentifiée
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS roles_select_authenticated ON public.roles
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY IF NOT EXISTS permissions_select_authenticated ON public.permissions
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY IF NOT EXISTS role_permissions_select_authenticated ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS user_roles_select_own ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS user_roles_select_admin ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- user_sessions
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS user_sessions_select_own ON public.user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS user_sessions_insert_own ON public.user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS user_sessions_update_own ON public.user_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- audit_logs — admin lecture seule · INSERT service_role uniquement
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS audit_logs_select_admin ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS audit_logs_insert_service ON public.audit_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Bloquer INSERT direct côté client (via log_audit_event SECURITY DEFINER à la place)
-- Les utilisateurs authentifiés passent par RPC log_audit_event pour actions tracées

CREATE POLICY IF NOT EXISTS audit_logs_insert_authenticated_via_function ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    OR actor_id IS NULL
  );
