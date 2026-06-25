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
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";

/** Metadata domain persistence — mirrors @sonafrik/metadata MetadataRepository + write ops */
export interface MetadataPersistenceRepository {
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
  save(record: MetadataDomainRecord, context: PersistenceContext): Promise<MetadataDomainRecord>;
  archive(metadataId: MetadataID, context: PersistenceContext): Promise<void>;
  search(
    filter: Readonly<Record<string, unknown>>,
    context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly MetadataDomainRecord[]>;
}
