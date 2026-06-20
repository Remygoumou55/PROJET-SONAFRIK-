-- ============================================================
-- Sprint 9 — Rights OS
-- Tables : works, contributors, ownerships, ownership_versions,
--           contracts, rights_claims
-- Règle CDC : ownership total = 100% par work (trigger)
-- ============================================================

-- ─── Types énumérés (idempotents — safe pour re-run en Preview) ──────────────

DO $$ BEGIN
  CREATE TYPE contributor_role AS ENUM (
    'author', 'composer', 'lyricist', 'producer', 'arranger', 'performer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ownership_type AS ENUM (
    'master', 'publishing', 'neighboring'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contract_type AS ENUM (
    'sync', 'license', 'distribution', 'publishing', 'management'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rights_claim_type AS ENUM (
    'ownership', 'infringement', 'takedown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rights_claim_status AS ENUM (
    'pending', 'accepted', 'rejected', 'escalated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── works ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS works (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  iswc        TEXT UNIQUE,              -- International Standard Musical Work Code T-xxx.xxx.xxx-x
  genre       TEXT,
  language    TEXT NOT NULL DEFAULT 'fr',
  description TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_works_creator_id ON works (creator_id) WHERE deleted_at IS NULL;

-- ─── contributors ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contributors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id      UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  profile_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
  role         contributor_role NOT NULL,
  ipi          TEXT,                    -- Interested Parties Information number
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributors_work_id ON contributors (work_id);

-- ─── ownerships ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ownerships (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id        UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  share_percent  NUMERIC(5,2) NOT NULL CHECK (share_percent > 0 AND share_percent <= 100),
  ownership_type ownership_type NOT NULL DEFAULT 'master',
  territory      TEXT NOT NULL DEFAULT 'worldwide',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (work_id, contributor_id, ownership_type, territory)
);

CREATE INDEX IF NOT EXISTS idx_ownerships_work_id ON ownerships (work_id);

-- Trigger : total des parts par (work_id, ownership_type, territory) ≤ 100
CREATE OR REPLACE FUNCTION check_ownership_total()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(share_percent), 0)
    INTO total
    FROM ownerships
   WHERE work_id        = NEW.work_id
     AND ownership_type = NEW.ownership_type
     AND territory      = NEW.territory
     AND id            != COALESCE(NEW.id, gen_random_uuid());

  IF total + NEW.share_percent > 100 THEN
    RAISE EXCEPTION 'La somme des parts de propriété dépasse 100%% (actuel: %, ajout: %)',
      total, NEW.share_percent;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_ownership_total ON ownerships;
CREATE TRIGGER trg_check_ownership_total
  BEFORE INSERT OR UPDATE ON ownerships
  FOR EACH ROW EXECUTE FUNCTION check_ownership_total();

-- ─── ownership_versions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ownership_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id        UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot       JSONB NOT NULL DEFAULT '{}',
  created_by     UUID NOT NULL REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (work_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_ownership_versions_work_id ON ownership_versions (work_id);

-- ─── contracts ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contracts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id              UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  creator_id           UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  counterparty_name    TEXT NOT NULL CHECK (char_length(counterparty_name) BETWEEN 1 AND 200),
  contract_type        contract_type NOT NULL,
  start_date           DATE,
  end_date             DATE,
  revenue_share_percent NUMERIC(5,2) CHECK (revenue_share_percent >= 0 AND revenue_share_percent <= 100),
  terms                TEXT,
  signed_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ,
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_contracts_work_id     ON contracts (work_id)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_creator_id  ON contracts (creator_id)  WHERE deleted_at IS NULL;

-- ─── rights_claims ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rights_claims (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id      UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  claimant_id  UUID NOT NULL REFERENCES profiles(id),
  claim_type   rights_claim_type NOT NULL,
  status       rights_claim_status NOT NULL DEFAULT 'pending',
  description  TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  evidence_url TEXT,
  reviewed_by  UUID REFERENCES profiles(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rights_claims_work_id     ON rights_claims (work_id);
CREATE INDEX IF NOT EXISTS idx_rights_claims_claimant_id ON rights_claims (claimant_id);
CREATE INDEX IF NOT EXISTS idx_rights_claims_status      ON rights_claims (status) WHERE status = 'pending';

-- ─── Mise à jour automatique de updated_at ────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_works_updated_at') THEN
    CREATE TRIGGER trg_works_updated_at
      BEFORE UPDATE ON works FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contributors_updated_at') THEN
    CREATE TRIGGER trg_contributors_updated_at
      BEFORE UPDATE ON contributors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ownerships_updated_at') THEN
    CREATE TRIGGER trg_ownerships_updated_at
      BEFORE UPDATE ON ownerships FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contracts_updated_at') THEN
    CREATE TRIGGER trg_contracts_updated_at
      BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rights_claims_updated_at') THEN
    CREATE TRIGGER trg_rights_claims_updated_at
      BEFORE UPDATE ON rights_claims FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE works             ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownerships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_claims     ENABLE ROW LEVEL SECURITY;

-- Idempotence : DROP IF EXISTS avant chaque CREATE (Supabase Preview branch depuis prod)
DROP POLICY IF EXISTS works_select             ON works;
DROP POLICY IF EXISTS works_insert             ON works;
DROP POLICY IF EXISTS works_update             ON works;
DROP POLICY IF EXISTS works_delete             ON works;
DROP POLICY IF EXISTS contributors_select      ON contributors;
DROP POLICY IF EXISTS contributors_insert      ON contributors;
DROP POLICY IF EXISTS contributors_update      ON contributors;
DROP POLICY IF EXISTS ownerships_select        ON ownerships;
DROP POLICY IF EXISTS ownerships_insert        ON ownerships;
DROP POLICY IF EXISTS ownerships_update        ON ownerships;
DROP POLICY IF EXISTS ownerships_delete        ON ownerships;
DROP POLICY IF EXISTS ownership_versions_select ON ownership_versions;
DROP POLICY IF EXISTS ownership_versions_insert ON ownership_versions;
DROP POLICY IF EXISTS contracts_select         ON contracts;
DROP POLICY IF EXISTS contracts_insert         ON contracts;
DROP POLICY IF EXISTS contracts_update         ON contracts;
DROP POLICY IF EXISTS rights_claims_select     ON rights_claims;
DROP POLICY IF EXISTS rights_claims_insert     ON rights_claims;

-- works : le créateur voit et modifie ses œuvres
CREATE POLICY works_select ON works FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM creators WHERE id = creator_id
    )
    OR EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = auth.uid() AND r.name = 'admin')
  );

CREATE POLICY works_insert ON works FOR INSERT
  WITH CHECK (
    creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
  );

CREATE POLICY works_update ON works FOR UPDATE
  USING (
    creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
  );

CREATE POLICY works_delete ON works FOR UPDATE
  USING (
    creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
  );

-- contributors : accessible par le créateur de l'œuvre
CREATE POLICY contributors_select ON contributors FOR SELECT
  USING (
    work_id IN (
      SELECT w.id FROM works w
      JOIN creators c ON c.id = w.creator_id
      WHERE c.owner_id = auth.uid()
    )
    OR profile_id = auth.uid()
  );

CREATE POLICY contributors_insert ON contributors FOR INSERT
  WITH CHECK (
    work_id IN (
      SELECT w.id FROM works w
      JOIN creators c ON c.id = w.creator_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY contributors_update ON contributors FOR UPDATE
  USING (
    work_id IN (
      SELECT w.id FROM works w
      JOIN creators c ON c.id = w.creator_id
      WHERE c.owner_id = auth.uid()
    )
  );

-- ownerships : même règle que contributors
CREATE POLICY ownerships_select ON ownerships FOR SELECT
  USING (
    work_id IN (
      SELECT w.id FROM works w
      JOIN creators c ON c.id = w.creator_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY ownerships_insert ON ownerships FOR INSERT
  WITH CHECK (
    work_id IN (
      SELECT w.id FROM works w
      JOIN creators c ON c.id = w.creator_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY ownerships_update ON ownerships FOR UPDATE
  USING (
    work_id IN (
      SELECT w.id FROM works w
      JOIN creators c ON c.id = w.creator_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY ownerships_delete ON ownerships FOR DELETE
  USING (
    work_id IN (
      SELECT w.id FROM works w
      JOIN creators c ON c.id = w.creator_id
      WHERE c.owner_id = auth.uid()
    )
  );

-- ownership_versions : lecture seule pour le créateur de l'œuvre
CREATE POLICY ownership_versions_select ON ownership_versions FOR SELECT
  USING (
    work_id IN (
      SELECT w.id FROM works w
      JOIN creators c ON c.id = w.creator_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY ownership_versions_insert ON ownership_versions FOR INSERT
  WITH CHECK (
    work_id IN (
      SELECT w.id FROM works w
      JOIN creators c ON c.id = w.creator_id
      WHERE c.owner_id = auth.uid()
    )
  );

-- contracts : créateur de l'œuvre
CREATE POLICY contracts_select ON contracts FOR SELECT
  USING (
    creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = auth.uid() AND r.name = 'admin')
  );

CREATE POLICY contracts_insert ON contracts FOR INSERT
  WITH CHECK (
    creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
  );

CREATE POLICY contracts_update ON contracts FOR UPDATE
  USING (
    creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
  );

-- rights_claims : claimant voit ses propres claims; admin voit tout
CREATE POLICY rights_claims_select ON rights_claims FOR SELECT
  USING (
    claimant_id = auth.uid()
    OR work_id IN (
      SELECT w.id FROM works w
      JOIN creators c ON c.id = w.creator_id
      WHERE c.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = auth.uid() AND r.name = 'admin')
  );

CREATE POLICY rights_claims_insert ON rights_claims FOR INSERT
  WITH CHECK (claimant_id = auth.uid());

-- ─── Grants ──────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE        ON works              TO authenticated;
GRANT SELECT, INSERT, UPDATE        ON contributors       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ownerships        TO authenticated;
GRANT SELECT, INSERT                ON ownership_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE        ON contracts          TO authenticated;
GRANT SELECT, INSERT                ON rights_claims      TO authenticated;
