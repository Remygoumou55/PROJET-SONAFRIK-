-- Phase 3.5 — Metadata Platform Infrastructure
-- Non-destructive: new tables only, zero modification of existing business data
BEGIN;

-- ---------------------------------------------------------------------------
-- Health probe (single row)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metadata_platform_health (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  checked_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.metadata_platform_health (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Domain metadata records (JSONB payload + indexed columns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metadata_records (
  id uuid PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  payload jsonb NOT NULL,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT metadata_records_entity_unique UNIQUE (entity_type, entity_id),
  CONSTRAINT metadata_records_status_check CHECK (
    status IN ('draft', 'pending', 'validated', 'published', 'archived', 'rejected')
  )
);

CREATE INDEX IF NOT EXISTS idx_metadata_records_creator ON public.metadata_records(creator_id);
CREATE INDEX IF NOT EXISTS idx_metadata_records_status ON public.metadata_records(status);
CREATE INDEX IF NOT EXISTS idx_metadata_records_entity ON public.metadata_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_metadata_records_updated ON public.metadata_records(updated_at DESC);

-- ---------------------------------------------------------------------------
-- ISRC registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metadata_isrc_registry (
  isrc text PRIMARY KEY,
  status text NOT NULL DEFAULT 'available',
  metadata_id uuid REFERENCES public.metadata_records(id) ON DELETE SET NULL,
  track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_at timestamptz,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT metadata_isrc_status_check CHECK (
    status IN ('available', 'reserved', 'active', 'archived')
  )
);

CREATE INDEX IF NOT EXISTS idx_metadata_isrc_status ON public.metadata_isrc_registry(status);
CREATE INDEX IF NOT EXISTS idx_metadata_isrc_track ON public.metadata_isrc_registry(track_id);

-- ---------------------------------------------------------------------------
-- ISRC sequence counters (atomic advance via RPC)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metadata_isrc_sequence (
  country_code text NOT NULL,
  registrant_code text NOT NULL,
  year_of_reference text NOT NULL,
  last_designation integer NOT NULL DEFAULT 0,
  row_version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (country_code, registrant_code, year_of_reference),
  CONSTRAINT metadata_isrc_seq_designation_nonneg CHECK (last_designation >= 0)
);

-- ---------------------------------------------------------------------------
-- UPC registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metadata_upc_registry (
  upc text PRIMARY KEY,
  status text NOT NULL DEFAULT 'available',
  album_id uuid REFERENCES public.albums(id) ON DELETE SET NULL,
  reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_at timestamptz,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT metadata_upc_status_check CHECK (
    status IN ('available', 'active', 'reserved', 'archived')
  )
);

CREATE INDEX IF NOT EXISTS idx_metadata_upc_status ON public.metadata_upc_registry(status);

-- ---------------------------------------------------------------------------
-- Cross-identifier registry index
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metadata_registry_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_type text NOT NULL,
  identifier_value text NOT NULL,
  metadata_id uuid NOT NULL REFERENCES public.metadata_records(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT metadata_registry_type_check CHECK (identifier_type IN ('isrc', 'upc')),
  CONSTRAINT metadata_registry_identifier_unique UNIQUE (identifier_type, identifier_value)
);

CREATE INDEX IF NOT EXISTS idx_metadata_registry_metadata ON public.metadata_registry_index(metadata_id);

-- ---------------------------------------------------------------------------
-- Append-only audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metadata_audit_log (
  id uuid PRIMARY KEY,
  audit_metadata_id uuid NOT NULL UNIQUE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'validated',
  source text NOT NULL DEFAULT 'system',
  visibility text NOT NULL DEFAULT 'private',
  validation_state text NOT NULL DEFAULT 'valid',
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metadata_audit_actor ON public.metadata_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_metadata_audit_entity ON public.metadata_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_metadata_audit_created ON public.metadata_audit_log(created_at DESC);

-- ---------------------------------------------------------------------------
-- Version snapshots (optimistic locking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metadata_version_snapshots (
  version_id uuid PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  snapshot jsonb NOT NULL,
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'validated',
  source text NOT NULL DEFAULT 'system',
  visibility text NOT NULL DEFAULT 'private',
  validation_state text NOT NULL DEFAULT 'valid',
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metadata_versions_entity ON public.metadata_version_snapshots(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Release records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metadata_release_records (
  release_id uuid PRIMARY KEY,
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_metadata_releases_creator ON public.metadata_release_records(creator_id);

-- ---------------------------------------------------------------------------
-- Fingerprint records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metadata_fingerprint_records (
  fingerprint_id uuid PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  hash text,
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_metadata_fingerprint_hash ON public.metadata_fingerprint_records(hash)
  WHERE hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metadata_fingerprint_track ON public.metadata_fingerprint_records(track_id);

-- ---------------------------------------------------------------------------
-- RPC: atomic ISRC sequence advance (concurrency-safe)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.metadata_advance_isrc_sequence(
  p_country_code text,
  p_registrant_code text,
  p_year_of_reference text
)
RETURNS TABLE (
  country_code text,
  registrant_code text,
  year_of_reference text,
  last_designation integer,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.metadata_isrc_sequence AS s (
    country_code, registrant_code, year_of_reference, last_designation, updated_at
  )
  VALUES (p_country_code, p_registrant_code, p_year_of_reference, 1, now())
  ON CONFLICT (country_code, registrant_code, year_of_reference)
  DO UPDATE SET
    last_designation = s.last_designation + 1,
    row_version = s.row_version + 1,
    updated_at = now()
  RETURNING
    s.country_code,
    s.registrant_code,
    s.year_of_reference,
    s.last_designation,
    s.updated_at;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: conditional ISRC reserve (no double-reserve)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.metadata_reserve_isrc(
  p_isrc text,
  p_actor_id uuid
)
RETURNS public.metadata_isrc_registry
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.metadata_isrc_registry;
BEGIN
  UPDATE public.metadata_isrc_registry
  SET
    status = 'reserved',
    reserved_by = p_actor_id,
    reserved_at = now(),
    updated_at = now(),
    row_version = row_version + 1
  WHERE isrc = p_isrc
    AND status = 'available'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ISRC unavailable or not found: %', p_isrc
      USING ERRCODE = 'P0002';
  END IF;

  RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: conditional UPC reserve
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.metadata_reserve_upc(
  p_upc text,
  p_actor_id uuid
)
RETURNS public.metadata_upc_registry
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.metadata_upc_registry;
BEGIN
  UPDATE public.metadata_upc_registry
  SET
    status = 'reserved',
    reserved_by = p_actor_id,
    reserved_at = now(),
    updated_at = now(),
    row_version = row_version + 1
  WHERE upc = p_upc
    AND status = 'available'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'UPC unavailable or not found: %', p_upc
      USING ERRCODE = 'P0002';
  END IF;

  RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS — Zero Trust
-- ---------------------------------------------------------------------------
ALTER TABLE public.metadata_platform_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_isrc_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_isrc_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_upc_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_registry_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_version_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_release_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_fingerprint_records ENABLE ROW LEVEL SECURITY;

-- Health: admin read only
CREATE POLICY metadata_health_admin_select ON public.metadata_platform_health
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- metadata_records: creator ownership + admin
CREATE POLICY metadata_records_creator_select ON public.metadata_records
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY metadata_records_creator_insert ON public.metadata_records
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY metadata_records_creator_update ON public.metadata_records
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (creator_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY metadata_records_admin_all ON public.metadata_records
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Internal registries: admin only (ISRC invisible to listeners/creators)
CREATE POLICY metadata_isrc_admin_all ON public.metadata_isrc_registry
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY metadata_isrc_seq_admin_all ON public.metadata_isrc_sequence
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY metadata_upc_admin_all ON public.metadata_upc_registry
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY metadata_registry_index_admin_all ON public.metadata_registry_index
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Audit: append by actor, read own + admin
CREATE POLICY metadata_audit_insert ON public.metadata_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY metadata_audit_select ON public.metadata_audit_log
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid() OR public.is_admin(auth.uid()));

-- No UPDATE/DELETE on audit (append-only enforced by absence of policies)

-- Versions: creator + admin
CREATE POLICY metadata_versions_creator ON public.metadata_version_snapshots
  FOR ALL TO authenticated
  USING (creator_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (creator_id = auth.uid() OR public.is_admin(auth.uid()));

-- Releases: creator + admin
CREATE POLICY metadata_releases_creator ON public.metadata_release_records
  FOR ALL TO authenticated
  USING (creator_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (creator_id = auth.uid() OR public.is_admin(auth.uid()));

-- Fingerprints: creator member of track owner OR admin
CREATE POLICY metadata_fingerprints_creator ON public.metadata_fingerprint_records
  FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = metadata_fingerprint_records.track_id
        AND public.is_creator_member(t.creator_id)
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = metadata_fingerprint_records.track_id
        AND public.is_creator_member(t.creator_id)
    )
  );

-- Grants (RLS filters rows; GRANT allows table access)
GRANT SELECT ON public.metadata_platform_health TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.metadata_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metadata_isrc_registry TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metadata_isrc_sequence TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metadata_upc_registry TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metadata_registry_index TO authenticated;
GRANT SELECT, INSERT ON public.metadata_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.metadata_version_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.metadata_release_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.metadata_fingerprint_records TO authenticated;

GRANT EXECUTE ON FUNCTION public.metadata_advance_isrc_sequence(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.metadata_reserve_isrc(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.metadata_reserve_upc(text, uuid) TO authenticated;

COMMIT;
