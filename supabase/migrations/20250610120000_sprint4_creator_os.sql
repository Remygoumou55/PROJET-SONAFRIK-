-- Sprint 4 — Creator OS complet
-- Artist Identity · Verification · Labels · Teams · Studios

-- ---------------------------------------------------------------------------
-- labels (créé avant creators pour éviter dépendances circulaires)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  description TEXT,
  logo_path TEXT,
  country_code TEXT NOT NULL DEFAULT 'GN',
  website_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_labels_owner ON public.labels(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_labels_slug ON public.labels(slug) WHERE deleted_at IS NULL;

CREATE TRIGGER labels_set_updated_at
  BEFORE UPDATE ON public.labels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- creators — entité professionnelle artiste
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label_id UUID REFERENCES public.labels(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended')),
  tier TEXT NOT NULL DEFAULT 'emergent' CHECK (tier IN ('emergent', 'croissance', 'etabli')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  UNIQUE (owner_id)
);

CREATE INDEX IF NOT EXISTS idx_creators_status ON public.creators(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_creators_label ON public.creators(label_id) WHERE deleted_at IS NULL;

CREATE TRIGGER creators_set_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- artist_profiles — identité publique artiste (1:1 creator)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artist_profiles (
  creator_id UUID PRIMARY KEY REFERENCES public.creators(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  genres TEXT[] NOT NULL DEFAULT '{}',
  banner_path TEXT,
  cover_path TEXT,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_artist_profiles_slug ON public.artist_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_artist_profiles_public ON public.artist_profiles(is_public) WHERE is_public = true;

ALTER TABLE public.artist_profiles
  ADD CONSTRAINT artist_profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 1000);

CREATE TRIGGER artist_profiles_set_updated_at
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- creator_roles — équipe & permissions internes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'editor', 'accountant', 'viewer')),
  invited_by UUID REFERENCES public.profiles(id),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  UNIQUE (creator_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_roles_member ON public.creator_roles(member_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_creator_roles_creator ON public.creator_roles(creator_id) WHERE deleted_at IS NULL;

CREATE TRIGGER creator_roles_set_updated_at
  BEFORE UPDATE ON public.creator_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- label_members — équipe label
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.label_members (
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'a_and_r', 'member')),
  invited_by UUID REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (label_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_label_members_member ON public.label_members(member_id) WHERE deleted_at IS NULL;

CREATE TRIGGER label_members_set_updated_at
  BEFORE UPDATE ON public.label_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- studios — espace de création (CDC Creator OS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT DEFAULT 'Conakry',
  country_code TEXT NOT NULL DEFAULT 'GN',
  address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_studios_creator ON public.studios(creator_id) WHERE deleted_at IS NULL;

CREATE TRIGGER studios_set_updated_at
  BEFORE UPDATE ON public.studios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- creator_verifications — workflow KYC / artiste / label
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  label_id UUID REFERENCES public.labels(id) ON DELETE SET NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('identity', 'artist', 'label')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  document_type TEXT CHECK (document_type IN ('national_id', 'passport', 'business_license', 'other')),
  document_path TEXT,
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_creator_verifications_creator ON public.creator_verifications(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_verifications_pending ON public.creator_verifications(status)
  WHERE status = 'pending';

CREATE TRIGGER creator_verifications_set_updated_at
  BEFORE UPDATE ON public.creator_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers Creator OS (SECURITY DEFINER + search_path)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_artist_account(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_user_id
      AND p.deleted_at IS NULL
      AND p.account_type IN ('artiste', 'auditeur_artiste')
      AND p.onboarding_completed = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_creator_member(
  p_creator_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.id = p_creator_id
      AND c.deleted_at IS NULL
      AND c.owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.creator_roles cr
    WHERE cr.creator_id = p_creator_id
      AND cr.member_id = p_user_id
      AND cr.deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manage_creator(
  p_creator_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT public.is_admin(p_user_id)
    OR EXISTS (
      SELECT 1 FROM public.creators c
      WHERE c.id = p_creator_id AND c.owner_id = p_user_id AND c.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.creator_roles cr
      WHERE cr.creator_id = p_creator_id
        AND cr.member_id = p_user_id
        AND cr.role IN ('owner', 'manager')
        AND cr.deleted_at IS NULL
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_edit_creator(
  p_creator_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT public.can_manage_creator(p_creator_id, p_user_id)
    OR EXISTS (
      SELECT 1 FROM public.creator_roles cr
      WHERE cr.creator_id = p_creator_id
        AND cr.member_id = p_user_id
        AND cr.role IN ('editor')
        AND cr.deleted_at IS NULL
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_label_member(
  p_label_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.labels l
    WHERE l.id = p_label_id AND l.owner_id = p_user_id AND l.deleted_at IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.label_members lm
    WHERE lm.label_id = p_label_id
      AND lm.member_id = p_user_id
      AND lm.deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manage_label(
  p_label_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT public.is_admin(p_user_id)
    OR EXISTS (
      SELECT 1 FROM public.labels l
      WHERE l.id = p_label_id AND l.owner_id = p_user_id AND l.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.label_members lm
      WHERE lm.label_id = p_label_id
        AND lm.member_id = p_user_id
        AND lm.role IN ('owner', 'admin')
        AND lm.deleted_at IS NULL
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- RPC: provisionner creator pour compte artiste
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_creator_for_current_user()
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_creator_id UUID;
  v_stage_name TEXT;
  v_slug TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autorisé.';
  END IF;

  IF NOT public.is_artist_account(v_user_id) THEN
    RAISE EXCEPTION 'Compte non éligible au Creator OS.';
  END IF;

  SELECT id INTO v_creator_id
  FROM public.creators
  WHERE owner_id = v_user_id AND deleted_at IS NULL;

  IF v_creator_id IS NOT NULL THEN
    RETURN v_creator_id;
  END IF;

  INSERT INTO public.creators (owner_id, created_by, updated_by)
  VALUES (v_user_id, v_user_id, v_user_id)
  RETURNING id INTO v_creator_id;

  INSERT INTO public.creator_roles (creator_id, member_id, role, invited_by, updated_by)
  VALUES (v_creator_id, v_user_id, 'owner', v_user_id, v_user_id);

  SELECT COALESCE(NULLIF(full_name, ''), phone, 'artiste-' || LEFT(v_user_id::text, 8))
  INTO v_stage_name
  FROM public.profiles WHERE id = v_user_id;

  v_slug := lower(regexp_replace(v_stage_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  IF v_slug = '' THEN
    v_slug := 'artiste-' || LEFT(v_user_id::text, 8);
  END IF;
  v_slug := v_slug || '-' || LEFT(v_creator_id::text, 8);

  INSERT INTO public.artist_profiles (creator_id, stage_name, slug, updated_by)
  VALUES (v_creator_id, v_stage_name, v_slug, v_user_id);

  PERFORM public.log_audit_event_authenticated(
    'creator.provisioned',
    'creators',
    v_creator_id,
    jsonb_build_object('owner_id', v_user_id)
  );

  RETURN v_creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.ensure_creator_for_current_user TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: soumettre vérification
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_creator_verification(
  p_verification_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  SELECT creator_id INTO v_creator_id
  FROM public.creator_verifications
  WHERE id = p_verification_id;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Vérification introuvable.';
  END IF;

  IF NOT public.can_edit_creator(v_creator_id) THEN
    RAISE EXCEPTION 'Accès non autorisé.';
  END IF;

  UPDATE public.creator_verifications
  SET status = 'pending',
      submitted_at = now(),
      updated_by = auth.uid()
  WHERE id = p_verification_id
    AND status IN ('draft', 'rejected');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Impossible de soumettre cette vérification.';
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'creator.verification.submitted',
    'creator_verifications',
    p_verification_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.submit_creator_verification TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: revue admin vérification
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_creator_verification(
  p_verification_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_row public.creator_verifications%ROWTYPE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès administrateur requis.';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Statut invalide.';
  END IF;

  SELECT * INTO v_row FROM public.creator_verifications WHERE id = p_verification_id;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Vérification introuvable.';
  END IF;

  UPDATE public.creator_verifications
  SET status = p_status,
      rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      updated_by = auth.uid()
  WHERE id = p_verification_id;

  IF p_status = 'approved' AND v_row.verification_type = 'artist' THEN
    UPDATE public.artist_profiles
    SET verified = true, verified_at = now(), updated_by = auth.uid()
    WHERE creator_id = v_row.creator_id;
  END IF;

  IF p_status = 'approved' AND v_row.verification_type = 'label' AND v_row.label_id IS NOT NULL THEN
    UPDATE public.labels SET verified = true, updated_by = auth.uid() WHERE id = v_row.label_id;
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'creator.verification.reviewed',
    'creator_verifications',
    p_verification_id,
    jsonb_build_object('status', p_status)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.review_creator_verification TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage creator-assets (privé — URLs signées)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-assets',
  'creator-assets',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
