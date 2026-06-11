-- Sprint 8 — Wallet OS RLS + permissions
-- SONAFRIK CDC V9.0

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_calculations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- wallets
-- ---------------------------------------------------------------------------
CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- INSERT only via create_wallet_for_new_profile trigger (SECURITY DEFINER)
CREATE POLICY "wallets_insert_trigger" ON public.wallets
  FOR INSERT WITH CHECK (false);

-- UPDATE only via RPCs (SECURITY DEFINER)
CREATE POLICY "wallets_update_rpc" ON public.wallets
  FOR UPDATE USING (false);

-- ---------------------------------------------------------------------------
-- wallet_ledger (INSERT ONLY — trigger bloque UPDATE/DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY "wallet_ledger_select_own" ON public.wallet_ledger
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- INSERT via RPCs (SECURITY DEFINER) uniquement
CREATE POLICY "wallet_ledger_insert_rpc" ON public.wallet_ledger
  FOR INSERT WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- INSERT/UPDATE via Edge Functions (service_role bypass RLS)
CREATE POLICY "transactions_insert_service" ON public.transactions
  FOR INSERT WITH CHECK (false);

CREATE POLICY "transactions_update_admin" ON public.transactions
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- withdrawals
-- ---------------------------------------------------------------------------
CREATE POLICY "withdrawals_select_own" ON public.withdrawals
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- INSERT via request_withdrawal RPC (SECURITY DEFINER)
CREATE POLICY "withdrawals_insert_rpc" ON public.withdrawals
  FOR INSERT WITH CHECK (false);

CREATE POLICY "withdrawals_update_admin" ON public.withdrawals
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- payout_accounts
-- ---------------------------------------------------------------------------
CREATE POLICY "payout_accounts_select_own" ON public.payout_accounts
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

-- INSERT via add_payout_account RPC (SECURITY DEFINER)
CREATE POLICY "payout_accounts_insert_rpc" ON public.payout_accounts
  FOR INSERT WITH CHECK (false);

CREATE POLICY "payout_accounts_update_own" ON public.payout_accounts
  FOR UPDATE USING (user_id = auth.uid() AND deleted_at IS NULL);

-- ---------------------------------------------------------------------------
-- royalty_cycles — lecture publique pour les artistes
-- ---------------------------------------------------------------------------
CREATE POLICY "royalty_cycles_select_auth" ON public.royalty_cycles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "royalty_cycles_manage_admin" ON public.royalty_cycles
  FOR ALL USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- royalty_calculations
-- ---------------------------------------------------------------------------
CREATE POLICY "royalty_calculations_select_own" ON public.royalty_calculations
  FOR SELECT USING (
    artist_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "royalty_calculations_manage_admin" ON public.royalty_calculations
  FOR ALL USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Permissions Wallet OS
-- ---------------------------------------------------------------------------
INSERT INTO public.permissions (code, description) VALUES
  ('wallet:view',              'Voir son portefeuille'),
  ('wallet:topup',             'Recharger son portefeuille'),
  ('wallet:subscribe',         'Souscrire à un abonnement'),
  ('wallet:withdraw',          'Demander un retrait'),
  ('wallet:payout:manage',     'Gérer ses comptes de retrait'),
  ('royalty:view:own',         'Voir ses royalties'),
  ('admin:wallet:manage',      'Gérer tous les portefeuilles'),
  ('admin:royalty:distribute', 'Distribuer les royalties')
ON CONFLICT (code) DO NOTHING;

-- Assign wallet permissions to roles
DO $$
DECLARE
  v_auditeur_id UUID;
  v_artiste_id UUID;
  v_auditeur_artiste_id UUID;
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_auditeur_id FROM public.roles WHERE name = 'auditeur';
  SELECT id INTO v_artiste_id FROM public.roles WHERE name = 'artiste';
  SELECT id INTO v_auditeur_artiste_id FROM public.roles WHERE name = 'auditeur_artiste';
  SELECT id INTO v_admin_id FROM public.roles WHERE name = 'admin';

  -- Auditeur
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_auditeur_id, id FROM public.permissions
  WHERE code IN ('wallet:view', 'wallet:topup', 'wallet:subscribe', 'wallet:payout:manage')
  ON CONFLICT DO NOTHING;

  -- Artiste
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_artiste_id, id FROM public.permissions
  WHERE code IN ('wallet:view', 'wallet:topup', 'wallet:subscribe', 'wallet:withdraw', 'wallet:payout:manage', 'royalty:view:own')
  ON CONFLICT DO NOTHING;

  -- Auditeur+Artiste
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_auditeur_artiste_id, id FROM public.permissions
  WHERE code IN ('wallet:view', 'wallet:topup', 'wallet:subscribe', 'wallet:withdraw', 'wallet:payout:manage', 'royalty:view:own')
  ON CONFLICT DO NOTHING;

  -- Admin
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_admin_id, id FROM public.permissions
  WHERE code IN ('wallet:view', 'wallet:topup', 'wallet:subscribe', 'wallet:withdraw', 'wallet:payout:manage', 'royalty:view:own', 'admin:wallet:manage', 'admin:royalty:distribute')
  ON CONFLICT DO NOTHING;
END $$;
