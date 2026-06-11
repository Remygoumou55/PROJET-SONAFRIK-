-- Security Hardening — SONAFRIK Enterprise Zero Trust
-- 20260611010000_security_hardening.sql

-- ---------------------------------------------------------------------------
-- 1. Renforcer la politique INSERT des audit_logs
--    Supprimer l'autorisation actor_id IS NULL — un utilisateur authentifié
--    doit toujours être associé à ses propres événements d'audit.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_logs_insert_authenticated_via_function ON public.audit_logs;

CREATE POLICY audit_logs_insert_own ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Permettre aux utilisateurs de consulter leur propre historique d'activité
--    (awareness de sécurité — détection de connexions suspectes)
-- ---------------------------------------------------------------------------
CREATE POLICY audit_logs_select_own ON public.audit_logs
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

-- Remplacer la politique admin existante pour éviter le conflit OR avec la nouvelle
DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;

CREATE POLICY audit_logs_select_admin ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Helper RPC : has_permission — vérification déclarative des permissions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_permission(
  p_user_id UUID,
  p_permission_code TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND p.code = p_permission_code
      AND p.deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.has_permission FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. RPC : get_my_recent_activity
--    Expose à l'utilisateur son propre journal d'audit (20 derniers événements)
--    pour détecter les accès suspects sans exposer ceux des autres.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_recent_activity(
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id          UUID,
  action      TEXT,
  entity_type TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ
) AS $$
  SELECT al.id, al.action, al.entity_type, al.metadata, al.created_at
  FROM public.audit_logs al
  WHERE al.actor_id = auth.uid()
  ORDER BY al.created_at DESC
  LIMIT LEAST(p_limit, 100);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_my_recent_activity TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Indexes de performance pour les fonctions de sécurité critiques
--    (is_admin, is_creator_member, can_edit_creator sont appelées dans
--    CHAQUE évaluation de politique RLS — leur performance est critique)
-- ---------------------------------------------------------------------------

-- is_admin() — recherche (user_id, role_name)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role_id
  ON public.user_roles(user_id, role_id);

CREATE INDEX IF NOT EXISTS idx_roles_name_not_deleted
  ON public.roles(name)
  WHERE deleted_at IS NULL;

-- Audit logs — requêtes par acteur et par action
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action
  ON public.audit_logs(actor_id, action);

-- Stream sessions — anti-fraude : sessions actives par utilisateur
CREATE INDEX IF NOT EXISTS idx_stream_sessions_user_active
  ON public.stream_sessions(user_id, track_id)
  WHERE completed_at IS NULL;

-- Wallet — accès balance par utilisateur
CREATE INDEX IF NOT EXISTS idx_wallets_user_balance
  ON public.wallets(user_id, balance_gnf);

-- Notifications non lues (dashboard sidebar)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_priority
  ON public.notifications(user_id, priority, created_at DESC)
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- Payout accounts actifs par utilisateur
CREATE INDEX IF NOT EXISTS idx_payout_accounts_user_default
  ON public.payout_accounts(user_id, is_default)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 6. Sécuriser les fonctions existantes : SET search_path explicite
--    (prévient les attaques par search_path hijacking)
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.is_admin(UUID) SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.create_wallet_for_new_profile() SET search_path = public;
