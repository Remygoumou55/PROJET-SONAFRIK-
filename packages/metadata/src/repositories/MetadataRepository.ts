import type {
  AlbumMetadata,
  ArtistMetadata,
  AuditMetadata,
  DeliveryMetadata,
  DistributionMetadata,
  FingerprintMetadata,
  MetadataContext,
  MetadataDomainRecord,
  MetadataID,
  ReleaseMetadata,
  RoyaltyMetadata,
  StorageMetadata,
  TrackMetadata,
  VersionMetadata,
} from "@sonafrik/types";

/** Persistence abstraction — no Supabase coupling in Phase 1 */
export interface MetadataRepository {
  findTrackMetadata(trackId: string, context: MetadataContext): Promise<TrackMetadata | null>;
  findAlbumMetadata(albumId: string, context: MetadataContext): Promise<AlbumMetadata | null>;
  findArtistMetadata(creatorId: string, context: MetadataContext): Promise<ArtistMetadata | null>;
  findReleaseMetadata(releaseId: string, context: MetadataContext): Promise<ReleaseMetadata | null>;
  findRoyaltyMetadata(royaltyId: string, context: MetadataContext): Promise<RoyaltyMetadata | null>;
  findDistributionMetadata(
    distributionId: string,
    context: MetadataContext,
  ): Promise<DistributionMetadata | null>;
  findFingerprintMetadata(
    fingerprintId: string,
    context: MetadataContext,
  ): Promise<FingerprintMetadata | null>;
  findVersionMetadata(versionId: string, context: MetadataContext): Promise<VersionMetadata | null>;
  findAuditMetadata(auditId: string, context: MetadataContext): Promise<AuditMetadata | null>;
  findStorageMetadata(storageId: string, context: MetadataContext): Promise<StorageMetadata | null>;
  findDeliveryMetadata(deliveryId: string, context: MetadataContext): Promise<DeliveryMetadata | null>;
  findById(metadataId: MetadataID, context: MetadataContext): Promise<MetadataDomainRecord | null>;
}
