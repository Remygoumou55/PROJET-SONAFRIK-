/** Enumerations — Metadata Engine Phase 1 */

export const METADATA_STATUS = {
  DRAFT: "draft",
  READY: "ready",
  VALIDATED: "validated",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export type MetadataStatus = (typeof METADATA_STATUS)[keyof typeof METADATA_STATUS];

export const METADATA_SOURCE = {
  MANUAL: "manual",
  GENERATED: "generated",
  IMPORTED: "imported",
  MIGRATED: "migrated",
} as const;

export type MetadataSource = (typeof METADATA_SOURCE)[keyof typeof METADATA_SOURCE];

export const METADATA_VISIBILITY = {
  PRIVATE: "private",
  INTERNAL: "internal",
  PUBLIC: "public",
} as const;

export type MetadataVisibility = (typeof METADATA_VISIBILITY)[keyof typeof METADATA_VISIBILITY];

export const METADATA_VALIDATION_STATE = {
  PENDING: "pending",
  PASSED: "passed",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

export type MetadataValidationState =
  (typeof METADATA_VALIDATION_STATE)[keyof typeof METADATA_VALIDATION_STATE];

export const FINGERPRINT_STATUS = {
  PENDING: "pending",
  GENERATED: "generated",
  VERIFIED: "verified",
  DUPLICATE: "duplicate",
  FAILED: "failed",
} as const;

export type FingerprintStatus = (typeof FINGERPRINT_STATUS)[keyof typeof FINGERPRINT_STATUS];

export const METADATA_RELEASE_TYPE = {
  ALBUM: "album",
  SINGLE: "single",
  EP: "ep",
  COMPILATION: "compilation",
} as const;

export type MetadataReleaseType =
  (typeof METADATA_RELEASE_TYPE)[keyof typeof METADATA_RELEASE_TYPE];

export const DISTRIBUTION_STATUS = {
  PENDING: "pending",
  READY: "ready",
  DELIVERED: "delivered",
  FAILED: "failed",
} as const;

export type DistributionStatus =
  (typeof DISTRIBUTION_STATUS)[keyof typeof DISTRIBUTION_STATUS];

export const ROYALTY_BINDING_STATUS = {
  UNLINKED: "unlinked",
  LINKED: "linked",
  RECONCILED: "reconciled",
} as const;

export type RoyaltyBindingStatus =
  (typeof ROYALTY_BINDING_STATUS)[keyof typeof ROYALTY_BINDING_STATUS];

export const METADATA_VERSION_ACTION = {
  CREATED: "created",
  UPDATED: "updated",
  MERGED: "merged",
  ROLLED_BACK: "rolled_back",
} as const;

export type MetadataVersionAction =
  (typeof METADATA_VERSION_ACTION)[keyof typeof METADATA_VERSION_ACTION];

export const METADATA_ENTITY_TYPE = {
  TRACK: "track",
  ALBUM: "album",
  RELEASE: "release",
  ARTIST: "artist",
} as const;

export type MetadataEntityType = (typeof METADATA_ENTITY_TYPE)[keyof typeof METADATA_ENTITY_TYPE];
