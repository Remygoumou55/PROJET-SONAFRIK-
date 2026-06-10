-- Sprint 2 — Identity OS + AUDIT_LOG
-- SONAFRIK CDC V9.0

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  account_type TEXT CHECK (
    account_type IN ('auditeur', 'artiste', 'auditeur_artiste')
  ),
  locale TEXT NOT NULL DEFAULT 'fr',
  fraud_score INTEGER NOT NULL DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_phone ON public.profiles(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_account_type ON public.profiles(account_type) WHERE deleted_at IS NULL;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------------
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER roles_set_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------------
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER permissions_set_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- role_permissions
-- ---------------------------------------------------------------------------
CREATE TABLE public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- ---------------------------------------------------------------------------
-- user_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT,
  device_name TEXT,
  platform TEXT CHECK (platform IN ('web', 'ios', 'android')),
  ip_address INET,
  user_agent TEXT,
  session_token_hash TEXT,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id)
  WHERE revoked_at IS NULL;

CREATE TRIGGER user_sessions_set_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_logs — INSERT ONLY (Règle #6 CDC)
-- ---------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION public.prevent_audit_logs_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs est en lecture seule absolue — INSERT uniquement (Règle #6 SONAFRIK)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_logs_mutation();

CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_logs_mutation();

-- ---------------------------------------------------------------------------
-- Audit helper (SECURITY DEFINER — appels service role / triggers)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_id UUID,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    actor_id, action, entity_type, entity_id, metadata, ip_address, user_agent
  ) VALUES (
    p_actor_id, p_action, p_entity_type, p_entity_id, p_metadata, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.log_audit_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event TO service_role;

-- ---------------------------------------------------------------------------
-- Auto-create profile on auth.users signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, email, created_by, updated_by)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    NEW.id,
    NEW.id
  );

  PERFORM public.log_audit_event(
    NEW.id,
    'auth.user.created',
    'profiles',
    NEW.id,
    jsonb_build_object('phone', NEW.phone, 'email', NEW.email)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Assign default role from account_type
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_role_for_account_type(
  p_user_id UUID,
  p_account_type TEXT,
  p_assigned_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_role_id UUID;
  v_role_name TEXT;
BEGIN
  v_role_name := CASE p_account_type
    WHEN 'auditeur' THEN 'auditeur'
    WHEN 'artiste' THEN 'artiste'
    WHEN 'auditeur_artiste' THEN 'auditeur_artiste'
    ELSE NULL
  END;

  IF v_role_name IS NULL THEN
    RAISE EXCEPTION 'Type de compte invalide : %', p_account_type;
  END IF;

  SELECT id INTO v_role_id FROM public.roles WHERE name = v_role_name AND deleted_at IS NULL;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Rôle introuvable : %', v_role_name;
  END IF;

  INSERT INTO public.user_roles (user_id, role_id, assigned_by)
  VALUES (p_user_id, v_role_id, COALESCE(p_assigned_by, p_user_id))
  ON CONFLICT (user_id, role_id) DO NOTHING;

  PERFORM public.log_audit_event(
    COALESCE(p_assigned_by, p_user_id),
    'auth.role.assigned',
    'user_roles',
    p_user_id,
    jsonb_build_object('role', v_role_name, 'account_type', p_account_type)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.assign_role_for_account_type FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_role_for_account_type TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_role_for_account_type TO service_role;
