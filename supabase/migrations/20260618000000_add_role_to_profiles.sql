-- À exécuter manuellement dans Supabase SQL Editor par Mr Rémy
-- Date : 2026-06-18
-- Ajoute les colonnes de rôle et d'onboarding détaillé à profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role             TEXT
    CHECK (role IN ('listener', 'artist', 'superadmin')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stage_name        TEXT,
  ADD COLUMN IF NOT EXISTS main_genre        TEXT,
  ADD COLUMN IF NOT EXISTS song_language     TEXT,
  ADD COLUMN IF NOT EXISTS origin_region     TEXT,
  ADD COLUMN IF NOT EXISTS orange_money_number TEXT,
  ADD COLUMN IF NOT EXISTS mtn_money_number    TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language  TEXT DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS backup_email        TEXT;

-- Backfill role depuis account_type pour les utilisateurs existants
UPDATE profiles
SET role = CASE account_type
             WHEN 'auditeur'          THEN 'listener'
             WHEN 'artiste'           THEN 'artist'
             WHEN 'auditeur_artiste'  THEN 'artist'
             ELSE NULL
           END
WHERE role IS NULL
  AND account_type IS NOT NULL
  AND deleted_at IS NULL;

-- Superadmin : utilisateurs ayant un rôle 'admin' dans user_roles
UPDATE profiles p
SET role = 'superadmin'
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = p.id
  AND r.name = 'admin'
  AND r.deleted_at IS NULL;
