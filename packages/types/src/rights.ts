/** SONAFRIK — Domaine Rights OS (Œuvres, Contributeurs, Propriété, Contrats) */

export type ContributorRole = "author" | "composer" | "lyricist" | "producer" | "arranger" | "performer";
export type OwnershipType = "master" | "publishing" | "neighboring";
export type ContractType = "sync" | "license" | "distribution" | "publishing" | "management";
export type RightsClaimType = "ownership" | "infringement" | "takedown";
export type RightsClaimStatus = "pending" | "accepted" | "rejected" | "escalated";

export interface Work {
  id: string;
  creator_id: string;
  title: string;
  iswc: string | null;
  genre: string | null;
  language: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Contributor {
  id: string;
  work_id: string;
  profile_id: string | null;
  display_name: string;
  role: ContributorRole;
  ipi: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ownership {
  id: string;
  work_id: string;
  contributor_id: string;
  share_percent: number;
  ownership_type: OwnershipType;
  territory: string;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface OwnershipVersion {
  id: string;
  work_id: string;
  version_number: number;
  snapshot: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

export interface Contract {
  id: string;
  work_id: string;
  creator_id: string;
  counterparty_name: string;
  contract_type: ContractType;
  start_date: string | null;
  end_date: string | null;
  revenue_share_percent: number | null;
  terms: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RightsClaim {
  id: string;
  work_id: string;
  claimant_id: string;
  claim_type: RightsClaimType;
  status: RightsClaimStatus;
  description: string;
  evidence_url: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkWithDetails extends Work {
  contributors: (Contributor & { ownerships: Ownership[] })[];
  contracts: Contract[];
  claims: RightsClaim[];
}

export const CONTRIBUTOR_ROLE_LABELS: Record<ContributorRole, string> = {
  author:    "Auteur",
  composer:  "Compositeur",
  lyricist:  "Parolier",
  producer:  "Producteur",
  arranger:  "Arrangeur",
  performer: "Interprète",
};

export const OWNERSHIP_TYPE_LABELS: Record<OwnershipType, string> = {
  master:      "Master",
  publishing:  "Édition",
  neighboring: "Droits voisins",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  sync:         "Synchronisation",
  license:      "Licence",
  distribution: "Distribution",
  publishing:   "Édition musicale",
  management:   "Management",
};

export const RIGHTS_CLAIM_STATUS_LABELS: Record<RightsClaimStatus, string> = {
  pending:   "En attente",
  accepted:  "Acceptée",
  rejected:  "Rejetée",
  escalated: "Escaladée",
};

export const RIGHTS_CLAIM_TYPE_LABELS: Record<RightsClaimType, string> = {
  ownership:    "Revendication de propriété",
  infringement: "Infraction aux droits",
  takedown:     "Demande de retrait",
};

export const RIGHTS_ERROR_MESSAGES: Record<string, string> = {
  unauthorized:            "Accès non autorisé.",
  work_not_found:          "Œuvre introuvable.",
  contributor_not_found:   "Contributeur introuvable.",
  contract_not_found:      "Contrat introuvable.",
  claim_not_found:         "Revendication introuvable.",
  ownership_exceeds_100:   "La somme des parts de propriété dépasse 100%.",
  invalid_work:            "Données d'œuvre invalides.",
  invalid_contributor:     "Données de contributeur invalides.",
  invalid_ownership:       "Données de propriété invalides.",
  invalid_contract:        "Données de contrat invalides.",
  invalid_claim:           "Données de revendication invalides.",
  work_create_failed:      "Impossible de créer l'œuvre.",
  work_update_failed:      "Impossible de modifier l'œuvre.",
  contributor_add_failed:  "Impossible d'ajouter le contributeur.",
  ownership_set_failed:    "Impossible de définir les parts de propriété.",
  contract_create_failed:  "Impossible de créer le contrat.",
  claim_create_failed:     "Impossible de soumettre la revendication.",
  unknown:                 "Une erreur est survenue. Réessayez.",
};
