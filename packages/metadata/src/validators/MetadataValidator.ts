import type {
  AlbumMetadata,
  MetadataContext,
  MetadataValidationResult,
  ReleaseMetadata,
  TrackMetadata,
} from "@sonafrik/types";

export type { MetadataValidationIssue, MetadataValidationResult } from "@sonafrik/types";

/** Root validator contract */
export interface MetadataValidator<T> {
  validate(entity: T, context: MetadataContext): Promise<MetadataValidationResult>;
}

export type TrackMetadataValidator = MetadataValidator<TrackMetadata>;
export type AlbumMetadataValidator = MetadataValidator<AlbumMetadata>;
export type ReleaseMetadataValidator = MetadataValidator<ReleaseMetadata>;
