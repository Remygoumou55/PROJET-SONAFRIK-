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

export interface MetadataRecordRow {
  id: string;
  entity_type: string;
  entity_id: string;
  creator_id: string | null;
  status: string;
  payload: MetadataDomainRecord;
  row_version: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function inferEntityType(record: MetadataDomainRecord): string {
  if ("trackId" in record && record.trackId !== undefined) return "track";
  if ("albumId" in record && record.albumId !== undefined && !("releaseId" in record))
    return "album";
  if ("artistMetadataId" in record) return "artist";
  if ("releaseId" in record && "trackIds" in record) return "release";
  if ("royaltyId" in record) return "royalty";
  if ("distributionId" in record) return "distribution";
  if ("fingerprintId" in record && "hash" in record) return "fingerprint";
  if ("versionId" in record && "snapshot" in record) return "version";
  if ("auditMetadataId" in record) return "audit";
  if ("storageId" in record) return "storage";
  if ("deliveryId" in record) return "delivery";
  return "unknown";
}

function inferEntityId(record: MetadataDomainRecord): string {
  if ("trackId" in record && record.trackId) return record.trackId as string;
  if ("albumId" in record && record.albumId && !("releaseId" in record))
    return record.albumId as string;
  if ("artistMetadataId" in record) return record.artistMetadataId as string;
  if ("releaseId" in record) return record.releaseId as string;
  if ("royaltyId" in record) return record.royaltyId as string;
  if ("distributionId" in record) return record.distributionId as string;
  if ("fingerprintId" in record) return record.fingerprintId as string;
  if ("versionId" in record) return record.versionId as string;
  if ("auditMetadataId" in record) return record.auditMetadataId as string;
  if ("storageId" in record) return record.storageId as string;
  if ("deliveryId" in record) return record.deliveryId as string;
  return record.id as string;
}

function inferCreatorId(record: MetadataDomainRecord): string | null {
  if ("creatorId" in record && typeof record.creatorId === "string") return record.creatorId;
  if ("actorId" in record && typeof record.actorId === "string") return record.actorId;
  return null;
}

export function recordToRow(record: MetadataDomainRecord): Record<string, unknown> {
  return {
    id: record.id as string,
    entity_type: inferEntityType(record),
    entity_id: inferEntityId(record),
    creator_id: inferCreatorId(record),
    status: record.status,
    payload: record,
    row_version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export function rowToRecord(row: MetadataRecordRow): MetadataDomainRecord {
  return row.payload;
}

export async function findByEntityType<T extends MetadataDomainRecord>(
  fetch: (
    entityType: string,
    entityId: string,
    context: MetadataContext,
  ) => Promise<MetadataDomainRecord | null>,
  entityType: string,
  entityId: string,
  context: MetadataContext,
): Promise<T | null> {
  const record = await fetch(entityType, entityId, context);
  return (record as T | null) ?? null;
}

export type MetadataFinder = (
  metadataId: MetadataID,
  context: MetadataContext,
) => Promise<MetadataDomainRecord | null>;

export type {
  TrackMetadata,
  AlbumMetadata,
  ArtistMetadata,
  ReleaseMetadata,
  RoyaltyMetadata,
  DistributionMetadata,
  FingerprintMetadata,
  VersionMetadata,
  AuditMetadata,
  StorageMetadata,
  DeliveryMetadata,
};
