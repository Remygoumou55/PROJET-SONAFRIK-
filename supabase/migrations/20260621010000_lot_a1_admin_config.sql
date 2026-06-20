-- LOT A1 - Admin Config : feature_flags + system_settings
-- Utilise par AdminRepository (packages/api/src/admin/admin.repository.ts)
-- Acces admin uniquement (role = 'admin' dans public.profiles)

-- ---------------------------------------------------------------------------
-- Table : feature_flags
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE CHECK (name ~ '^[a-z_]+$'),
  enabled     BOOLEAN     NOT NULL DEFAULT false,
  description TEXT        CHECK (description IS NULL OR char_length(description) <= 300),
  metadata    JSONB       NOT NULL DEFAULT '{}',
  updated_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_flags_select_authenticated" ON public.feature_flags;
DROP POLICY IF EXISTS "feature_flags_write_admin"          ON public.feature_flags;

CREATE POLICY "feature_flags_select_authenticated" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "feature_flags_write_admin" ON public.feature_flags
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS set_updated_at_feature_flags ON public.feature_flags;
CREATE TRIGGER set_updated_at_feature_flags
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  ('beat_store',        false, 'Beat Store - vente de beats entre createurs'),
  ('tips_enabled',      true,  'Pourboires artiste (CDC Regle #5 : commission 5%)'),
  ('search_multi_type', true,  'Recherche multi-type (tracks + artistes + albums + playlists + beats)'),
  ('social_sharing',    false, 'Partage social natif'),
  ('mobile_app',        false, 'Application mobile React Native'),
  ('rights_management', true,  'Gestion des droits SONAFRIK (Rights OS)'),
  ('creator_analytics', false, 'Analytics avances createurs (non MVP)')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Table : system_settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL UNIQUE CHECK (key ~ '^[a-z_]+$'),
  value       JSONB       NOT NULL,
  description TEXT        CHECK (description IS NULL OR char_length(description) <= 300),
  category    TEXT        NOT NULL DEFAULT 'general'
              CHECK (category IN ('streaming', 'wallet', 'creator', 'admin', 'general')),
  updated_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_settings_select_authenticated" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_write_admin"          ON public.system_settings;

CREATE POLICY "system_settings_select_authenticated" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "system_settings_write_admin" ON public.system_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS set_updated_at_system_settings ON public.system_settings;
CREATE TRIGGER set_updated_at_system_settings
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Valeurs de reference CDC v9.0
INSERT INTO public.system_settings (key, value, description, category) VALUES
  ('stream_min_duration_seconds',  '27'::jsonb,               'Duree minimum pour compter un stream (90% x 30s)',  'streaming'),
  ('stream_heartbeat_interval_s',  '10'::jsonb,               'Intervalle heartbeat en secondes',                  'streaming'),
  ('tip_commission_percent',       '5'::jsonb,                'Commission interne sur pourboires - CDC Regle #5',  'wallet'),
  ('beat_commission_percent',      '0'::jsonb,                'Commission beats = 0 GNF - CDC Regle #4',           'creator'),
  ('premium_price_monthly_gnf',    '15000'::jsonb,            'Prix abonnement premium mensuel (GNF)',              'wallet'),
  ('max_upload_size_mb',           '200'::jsonb,              'Taille maximum upload audio (MB)',                   'creator'),
  ('revenue_pool_creator_percent', '65'::jsonb,               'Part createurs dans le pool de revenus (%)',         'wallet'),
  ('tip_amounts_gnf',              '[5000,10000,20000]'::jsonb,'Montants autorises pour les pourboires (GNF)',       'wallet')
ON CONFLICT (key) DO NOTHING;
