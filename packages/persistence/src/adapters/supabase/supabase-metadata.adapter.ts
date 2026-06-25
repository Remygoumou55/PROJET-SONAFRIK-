import type {
  MetadataContext,
  MetadataDomainRecord,
  MetadataID,
} from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import type { MetadataPersistenceRepository } from "../../contracts/metadata.repository";
import { NotFoundError } from "../../errors/persistence-errors";
import { mapVendorError } from "../../errors/persistence-errors";
import { METADATA_TABLES, type SupabaseClientPort } from "./supabase-client.port";
import {
  findByEntityType,
  recordToRow,
  rowToRecord,
  type AlbumMetadata,
  type ArtistMetadata,
  type AuditMetadata,
  type DeliveryMetadata,
  type DistributionMetadata,
  type FingerprintMetadata,
  type MetadataRecordRow,
  type ReleaseMetadata,
  type RoyaltyMetadata,
  type StorageMetadata,
  type TrackMetadata,
  type VersionMetadata,
} from "./metadata-record.mapper";
import { applyPagination, fromTable, runQuery, runQueryNullable, runVoidQuery } from "./supabase-query.helpers";

/** Supabase metadata records adapter */
export class SupabaseMetadataRepositoryAdapter implements MetadataPersistenceRepository {
  constructor(private readonly client: SupabaseClientPort) {}

  private async findByEntity(
    entityType: string,
    entityId: string,
    _context: MetadataContext,
  ): Promise<MetadataDomainRecord | null> {
    const data = await runQueryNullable<MetadataRecordRow>(() =>
      fromTable(this.client, METADATA_TABLES.RECORDS)
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .maybeSingle(),
    );
    return data ? rowToRecord(data) : null;
  }

  async findTrackMetadata(
    trackId: string,
    context: MetadataContext,
  ): Promise<TrackMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "track", trackId, context);
  }

  async findAlbumMetadata(
    albumId: string,
    context: MetadataContext,
  ): Promise<AlbumMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "album", albumId, context);
  }

  async findArtistMetadata(
    creatorId: string,
    context: MetadataContext,
  ): Promise<ArtistMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "artist", creatorId, context);
  }

  async findReleaseMetadata(
    releaseId: string,
    context: MetadataContext,
  ): Promise<ReleaseMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "release", releaseId, context);
  }

  async findRoyaltyMetadata(
    royaltyId: string,
    context: MetadataContext,
  ): Promise<RoyaltyMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "royalty", royaltyId, context);
  }

  async findDistributionMetadata(
    distributionId: string,
    context: MetadataContext,
  ): Promise<DistributionMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "distribution", distributionId, context);
  }

  async findFingerprintMetadata(
    fingerprintId: string,
    context: MetadataContext,
  ): Promise<FingerprintMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "fingerprint", fingerprintId, context);
  }

  async findVersionMetadata(
    versionId: string,
    context: MetadataContext,
  ): Promise<VersionMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "version", versionId, context);
  }

  async findAuditMetadata(
    auditId: string,
    context: MetadataContext,
  ): Promise<AuditMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "audit", auditId, context);
  }

  async findStorageMetadata(
    storageId: string,
    context: MetadataContext,
  ): Promise<StorageMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "storage", storageId, context);
  }

  async findDeliveryMetadata(
    deliveryId: string,
    context: MetadataContext,
  ): Promise<DeliveryMetadata | null> {
    return findByEntityType(this.findByEntity.bind(this), "delivery", deliveryId, context);
  }

  async findById(
    metadataId: MetadataID,
    _context: MetadataContext,
  ): Promise<MetadataDomainRecord | null> {
    const data = await runQueryNullable<MetadataRecordRow>(() =>
      fromTable(this.client, METADATA_TABLES.RECORDS)
        .select("*")
        .eq("id", metadataId as string)
        .maybeSingle(),
    );
    return data ? rowToRecord(data) : null;
  }

  async save(
    record: MetadataDomainRecord,
    _context: PersistenceContext,
  ): Promise<MetadataDomainRecord> {
    const data = await runQuery<MetadataRecordRow>(() =>
      fromTable(this.client, METADATA_TABLES.RECORDS)
        .upsert(recordToRow(record))
        .select()
        .single(),
    );
    return rowToRecord(data);
  }

  async archive(metadataId: MetadataID, _context: PersistenceContext): Promise<void> {
    const existing = await runQueryNullable<MetadataRecordRow>(() =>
      fromTable(this.client, METADATA_TABLES.RECORDS)
        .select("*")
        .eq("id", metadataId as string)
        .maybeSingle(),
    );
    if (!existing) throw new NotFoundError();
    await runVoidQuery(() =>
      fromTable(this.client, METADATA_TABLES.RECORDS)
        .update({
          status: "archived",
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          row_version: existing.row_version + 1,
        })
        .eq("id", metadataId as string),
    );
  }

  async search(
    filter: Readonly<Record<string, unknown>>,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly MetadataDomainRecord[]> {
    try {
      let query = fromTable(this.client, METADATA_TABLES.RECORDS).select("*");
      if (filter.status) query = query.eq("status", filter.status);
      if (filter.entity_type) query = query.eq("entity_type", filter.entity_type);
      if (filter.creator_id) query = query.eq("creator_id", filter.creator_id);
      query = applyPagination(query, options);
      const { data, error } = await query;
      if (error) throw error;
      return ((data as MetadataRecordRow[]) ?? []).map(rowToRecord);
    } catch (e) {
      throw mapVendorError(e);
    }
  }
}
