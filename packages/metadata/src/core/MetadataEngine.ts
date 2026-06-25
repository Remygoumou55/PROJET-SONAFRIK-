import type {
  AlbumMetadata,
  ArtistMetadata,
  MetadataContext,
  MetadataDomainRecord,
  MetadataID,
  ReleaseMetadata,
  TrackMetadata,
} from "@sonafrik/types";

/**
 * Read-only registry lookup — resolves entity keys to metadata records.
 * For mutable registration, see `RegistryService` in `services/`.
 */
export interface MetadataRegistry {
  resolveTrackMetadata(trackId: string): Promise<TrackMetadata | null>;
  resolveAlbumMetadata(albumId: string): Promise<AlbumMetadata | null>;
  resolveArtistMetadata(creatorId: string): Promise<ArtistMetadata | null>;
  resolveReleaseMetadata(releaseId: string): Promise<ReleaseMetadata | null>;
  resolveByMetadataId(metadataId: MetadataID): Promise<MetadataDomainRecord | null>;
}

/** Orchestrator entry point — Phase 2+ will implement pipeline execution */
export interface MetadataEngine {
  readonly registry: MetadataRegistry;
  createContext(actorId: string, correlationId: string): MetadataContext;
}
