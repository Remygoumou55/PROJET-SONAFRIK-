/** Metadata Engine error codes — consumed by @sonafrik/metadata error classes */
export const METADATA_ERROR_CODES = {
  UNKNOWN: "unknown",
  NOT_IMPLEMENTED: "not_implemented",
  VALIDATION_FAILED: "validation_failed",
  GENERATION_FAILED: "generation_failed",
  DUPLICATE_DETECTED: "duplicate_detected",
  REGISTRY_CONFLICT: "registry_conflict",
  PIPELINE_ABORTED: "pipeline_aborted",
  STORAGE_UNAVAILABLE: "storage_unavailable",
  PUBLICATION_BLOCKED: "publication_blocked",
} as const;

export type MetadataErrorCode = (typeof METADATA_ERROR_CODES)[keyof typeof METADATA_ERROR_CODES];

export const METADATA_ERROR_MESSAGES: Record<MetadataErrorCode, string> = {
  unknown: "Une erreur metadata est survenue.",
  not_implemented: "Fonctionnalité metadata non implémentée (Phase 2+).",
  validation_failed: "La validation metadata a échoué.",
  generation_failed: "La génération metadata a échoué.",
  duplicate_detected: "Un doublon metadata a été détecté.",
  registry_conflict: "Conflit dans le registre metadata.",
  pipeline_aborted: "Le pipeline metadata a été interrompu.",
  storage_unavailable: "Le stockage metadata est indisponible.",
  publication_blocked: "La publication metadata est bloquée.",
};
