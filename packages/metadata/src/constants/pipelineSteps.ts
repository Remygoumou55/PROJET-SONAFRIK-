/** Pipeline step identifiers — orchestration names (Phase 1 constants).
 * Distinct from `METADATA_PIPELINE_ACTION` in `@sonafrik/types/metadata`:
 * steps name pipeline slots; actions classify handler behavior. */
export const METADATA_PIPELINE_STEPS = {
  NORMALIZE: "normalize",
  VALIDATE: "validate",
  GENERATE_IDENTIFIERS: "generate_identifiers",
  FINGERPRINT: "fingerprint",
  LINK_ROYALTY: "link_royalty",
  PREPARE_DISTRIBUTION: "prepare_distribution",
  PUBLISH: "publish",
} as const;

export type MetadataPipelineStepName =
  (typeof METADATA_PIPELINE_STEPS)[keyof typeof METADATA_PIPELINE_STEPS];

/** Registry namespace keys for future multi-tenant metadata isolation */
export const METADATA_REGISTRY_NAMESPACES = {
  TRACK: "track",
  ALBUM: "album",
  ARTIST: "artist",
  RELEASE: "release",
  ROYALTY: "royalty",
  DISTRIBUTION: "distribution",
  FINGERPRINT: "fingerprint",
  VERSION: "version",
  AUDIT: "audit",
  STORAGE: "storage",
} as const;

export type MetadataRegistryNamespace =
  (typeof METADATA_REGISTRY_NAMESPACES)[keyof typeof METADATA_REGISTRY_NAMESPACES];
