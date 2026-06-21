-- Ajoute resolution_notes à rights_claims.
-- Ce champ était utilisé dans AdminRightsCenter.tsx mais absent de la table.
ALTER TABLE public.rights_claims
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT NULL;
