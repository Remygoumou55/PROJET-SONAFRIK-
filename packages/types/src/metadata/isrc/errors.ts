/** ISRC Engine error codes */
export const ISRC_ERROR_CODES = {
  PARSE_FAILED: "isrc_parse_failed",
  VALIDATION_FAILED: "isrc_validation_failed",
  NORMALIZATION_FAILED: "isrc_normalization_failed",
  GENERATION_FAILED: "isrc_generation_failed",
  DUPLICATE: "isrc_duplicate",
  NOT_FOUND: "isrc_not_found",
  RESERVATION_CONFLICT: "isrc_reservation_conflict",
  SEQUENCE_EXHAUSTED: "isrc_sequence_exhausted",
  REGISTRY_CONFLICT: "isrc_registry_conflict",
  LOCK_TIMEOUT: "isrc_lock_timeout",
} as const;

export type ISRCErrorCode = (typeof ISRC_ERROR_CODES)[keyof typeof ISRC_ERROR_CODES];

export const ISRC_ERROR_MESSAGES: Record<ISRCErrorCode, string> = {
  isrc_parse_failed: "Impossible de parser l'ISRC.",
  isrc_validation_failed: "La validation ISRC a échoué.",
  isrc_normalization_failed: "Impossible de normaliser l'ISRC.",
  isrc_generation_failed: "La génération ISRC a échoué.",
  isrc_duplicate: "Cet ISRC existe déjà dans le registre.",
  isrc_not_found: "ISRC introuvable dans le registre.",
  isrc_reservation_conflict: "Conflit de réservation ISRC.",
  isrc_sequence_exhausted: "Séquence ISRC épuisée.",
  isrc_registry_conflict: "Conflit dans le registre ISRC.",
  isrc_lock_timeout: "Timeout d'accès concurrent au registre ISRC.",
};
