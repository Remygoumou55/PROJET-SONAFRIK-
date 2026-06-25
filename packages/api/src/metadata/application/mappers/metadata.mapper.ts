import type { MetadataDomainRecord } from "@sonafrik/types";
import type { MetadataRecordDto, MetadataStatusDto } from "../dto";

function baseFields(record: MetadataDomainRecord): MetadataRecordDto {
  return {
    id: record.id as string,
    entityType: inferEntityType(record),
    entityId: inferEntityId(record),
    status: record.status,
    source: record.source,
    visibility: record.visibility,
    validationState: record.validationState,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function inferEntityType(record: MetadataDomainRecord): string {
  if ("fingerprintId" in record && "hash" in record) return "fingerprint";
  if ("distributionStatus" in record) return "distribution";
  if ("partnerCode" in record && "payloadFormat" in record) return "delivery";
  if ("trackId" in record && record.trackId && !("fingerprintId" in record)) return "track";
  if ("albumId" in record && record.albumId && !("releaseId" in record)) return "album";
  if ("artistMetadataId" in record) return "artist";
  if ("releaseId" in record && "trackIds" in record) return "release";
  if ("royaltyId" in record) return "royalty";
  if ("distributionId" in record) return "distribution";
  if ("versionId" in record && "snapshot" in record) return "version";
  if ("auditMetadataId" in record) return "audit";
  if ("storageId" in record) return "storage";
  return "unknown";
}

function inferEntityId(record: MetadataDomainRecord): string {
  if ("fingerprintId" in record && "hash" in record) return record.fingerprintId as string;
  if ("distributionStatus" in record) return record.distributionId as string;
  if ("partnerCode" in record && "payloadFormat" in record) return record.deliveryId as string;
  if ("trackId" in record && record.trackId && !("fingerprintId" in record))
    return record.trackId as string;
  if ("albumId" in record && record.albumId && !("releaseId" in record))
    return record.albumId as string;
  if ("artistMetadataId" in record) return record.artistMetadataId as string;
  if ("releaseId" in record) return record.releaseId as string;
  if ("royaltyId" in record) return record.royaltyId as string;
  if ("distributionId" in record) return record.distributionId as string;
  if ("versionId" in record) return record.versionId as string;
  if ("auditMetadataId" in record) return record.auditMetadataId as string;
  if ("storageId" in record) return record.storageId as string;
  return record.id as string;
}

export function toMetadataRecordDto(record: MetadataDomainRecord): MetadataRecordDto {
  return baseFields(record);
}

export function toMetadataStatusDto(record: MetadataDomainRecord): MetadataStatusDto {
  return {
    id: record.id as string,
    status: record.status,
    validationState: record.validationState,
    version: record.version,
  };
}

export function toMetadataRecordDtos(records: readonly MetadataDomainRecord[]): MetadataRecordDto[] {
  return records.map(toMetadataRecordDto);
}
