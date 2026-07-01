-- Admin fraud reviews (persistant) + flag career_os MVP OFF
BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_fraud_reviews (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id  TEXT        NOT NULL,
  admin_user_id UUID       NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treated      BOOLEAN     NOT NULL DEFAULT false,
  archived     BOOLEAN     NOT NULL DEFAULT false,
  hidden       BOOLEAN     NOT NULL DEFAULT false,
  notes        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (incident_id, admin_user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_fraud_reviews_admin
  ON public.admin_fraud_reviews (admin_user_id, updated_at DESC);

ALTER TABLE public.admin_fraud_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_fraud_reviews_select_admin" ON public.admin_fraud_reviews;
DROP POLICY IF EXISTS "admin_fraud_reviews_write_admin" ON public.admin_fraud_reviews;

CREATE POLICY "admin_fraud_reviews_select_admin" ON public.admin_fraud_reviews
  FOR SELECT TO authenticated
  USING (
    admin_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "admin_fraud_reviews_write_admin" ON public.admin_fraud_reviews
  FOR ALL TO authenticated
  USING (
    admin_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    admin_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP TRIGGER IF EXISTS set_updated_at_admin_fraud_reviews ON public.admin_fraud_reviews;
CREATE TRIGGER set_updated_at_admin_fraud_reviews
  BEFORE UPDATE ON public.admin_fraud_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_fraud_reviews TO authenticated;
GRANT ALL ON public.admin_fraud_reviews TO service_role;

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  ('career_os', false, 'Career OS enterprise — dashboard créateur avancé (post-MVP)')
ON CONFLICT (name) DO NOTHING;

COMMIT;
