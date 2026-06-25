/** Lifecycle status of an ISRC within the internal registry */
export const ISRC_REGISTRY_STATUS = {
  AVAILABLE: "available",
  ACTIVE: "active",
  RESERVED: "reserved",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export type ISRCRegistryStatus =
  (typeof ISRC_REGISTRY_STATUS)[keyof typeof ISRC_REGISTRY_STATUS];

/** Machine-readable validation failure codes */
export const ISRC_VALIDATION_CODE = {
  INVALID_FORMAT: "invalid_format",
  INVALID_LENGTH: "invalid_length",
  INVALID_COUNTRY_CODE: "invalid_country_code",
  INVALID_REGISTRANT: "invalid_registrant",
  INVALID_YEAR: "invalid_year",
  INVALID_DESIGNATION: "invalid_designation",
  DUPLICATE: "duplicate",
  RESERVED: "reserved",
  ARCHIVED: "archived",
  DELETED: "deleted",
  NOT_FOUND: "not_found",
} as const;

export type ISRCValidationCode =
  (typeof ISRC_VALIDATION_CODE)[keyof typeof ISRC_VALIDATION_CODE];

/** Audit action types for ISRC lifecycle events */
export const ISRC_AUDIT_ACTION = {
  GENERATED: "isrc.generated",
  VALIDATED: "isrc.validated",
  REGISTERED: "isrc.registered",
  RESERVED: "isrc.reserved",
  RELEASED: "isrc.released",
  COMMITTED: "isrc.committed",
  ARCHIVED: "isrc.archived",
  DELETED: "isrc.deleted",
  SEQUENCE_ADVANCED: "isrc.sequence_advanced",
} as const;

export type ISRCAuditAction = (typeof ISRC_AUDIT_ACTION)[keyof typeof ISRC_AUDIT_ACTION];
