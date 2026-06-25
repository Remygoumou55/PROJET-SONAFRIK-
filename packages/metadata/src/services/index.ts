import type {
  AlbumMetadata,
  ArtistMetadata,
  FingerprintMetadata,
  MetadataContext,
  MetadataValidationResult,
  ReleaseMetadata,
  TrackMetadata,
} from "@sonafrik/types";

/**
 * Aggregate metadata operations facade.
 * Phase 2+: wired through packages/api — never called from React components.
 */
export interface MetadataService {
  getTrackMetadata(trackId: string, context: MetadataContext): Promise<TrackMetadata | null>;
  getAlbumMetadata(albumId: string, context: MetadataContext): Promise<AlbumMetadata | null>;
  getArtistMetadata(creatorId: string, context: MetadataContext): Promise<ArtistMetadata | null>;
  getReleaseMetadata(releaseId: string, context: MetadataContext): Promise<ReleaseMetadata | null>;
  validateTrackMetadata(
    track: TrackMetadata,
    context: MetadataContext,
  ): Promise<MetadataValidationResult>;
}

/**
 * Cross-domain validation orchestration.
 * Phase 2+: coordinates TrackValidator, AlbumValidator, ReleaseValidator.
 */
export interface ValidationService {
  validateTrack(track: TrackMetadata, context: MetadataContext): Promise<MetadataValidationResult>;
  validateAlbum(album: AlbumMetadata, context: MetadataContext): Promise<MetadataValidationResult>;
  validateRelease(release: ReleaseMetadata, context: MetadataContext): Promise<MetadataValidationResult>;
}

/**
 * Mutable metadata registry — registration and external identifier lookup.
 * Distinct from read-only `MetadataRegistry` in `core/`.
 * Phase 2+: indexes metadata by entity type and external identifiers (ISRC, UPC).
 */
export interface RegistryService {
  registerTrackMetadata(metadata: TrackMetadata, context: MetadataContext): Promise<void>;
  registerAlbumMetadata(metadata: AlbumMetadata, context: MetadataContext): Promise<void>;
  lookupByIsrc(isrc: string, context: MetadataContext): Promise<TrackMetadata | null>;
  lookupByUpc(upc: string, context: MetadataContext): Promise<AlbumMetadata | null>;
}

/**
 * Identifier generation facade (ISRC, UPC).
 * Phase 2+: country-specific allocation rules for Guinea (GN) first.
 */
export interface GeneratorService {
  allocateIsrc(context: MetadataContext): Promise<string>;
  allocateUpc(context: MetadataContext): Promise<string>;
}

/**
 * Audio fingerprint lifecycle.
 * Phase 3+: Chromaprint or partner API integration.
 */
export interface FingerprintService {
  requestFingerprint(trackId: string, context: MetadataContext): Promise<FingerprintMetadata | null>;
  checkDuplicate(fingerprintId: string, context: MetadataContext): Promise<FingerprintMetadata | null>;
}

/**
 * Royalty metadata binding.
 * Phase 4+: maps track/album metadata to royalty_cycles without touching wallet logic.
 */
export interface RoyaltyBindingService {
  linkTrackToRoyalty(trackId: string, royaltyId: string, context: MetadataContext): Promise<void>;
  unlinkTrackFromRoyalty(trackId: string, context: MetadataContext): Promise<void>;
}

/**
 * Distribution metadata preparation.
 * Phase 5+: delivery payloads for partners — no distribution in Phase 1.
 */
export interface DistributionService {
  prepareReleaseDistribution(releaseId: string, context: MetadataContext): Promise<string | null>;
  markDeliveryReady(distributionId: string, context: MetadataContext): Promise<void>;
}
