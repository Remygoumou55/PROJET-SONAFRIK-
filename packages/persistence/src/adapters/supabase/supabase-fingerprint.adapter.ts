import type { FingerprintID, FingerprintMetadata, TrackID } from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import type { FingerprintPersistenceRepository } from "../../contracts/fingerprint.repository";
import { NotFoundError } from "../../errors/persistence-errors";
import { METADATA_TABLES, type SupabaseClientPort } from "./supabase-client.port";
import { applyPagination, fromTable, runQuery, runQueryNullable, runVoidQuery } from "./supabase-query.helpers";

interface FingerprintRow {
  fingerprint_id: string;
  track_id: string;
  hash: string | null;
  creator_id: string | null;
  payload: FingerprintMetadata;
  status: string;
  row_version: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function rowToFingerprint(row: FingerprintRow): FingerprintMetadata {
  return row.payload;
}

function fingerprintToRow(
  record: FingerprintMetadata,
  creatorId?: string | null,
): Record<string, unknown> {
  return {
    fingerprint_id: record.fingerprintId as string,
    track_id: record.trackId as string,
    hash: record.hash,
    creator_id: creatorId ?? null,
    payload: record,
    status: record.status,
    row_version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export class SupabaseFingerprintRepositoryAdapter implements FingerprintPersistenceRepository {
  constructor(private readonly client: SupabaseClientPort) {}

  async save(
    record: FingerprintMetadata,
    context: PersistenceContext,
  ): Promise<FingerprintMetadata> {
    const data = await runQuery<FingerprintRow>(() =>
      fromTable(this.client, METADATA_TABLES.FINGERPRINTS)
        .upsert(fingerprintToRow(record, context.actorId))
        .select()
        .single(),
    );
    return rowToFingerprint(data);
  }

  async findById(
    fingerprintId: FingerprintID,
    _context: PersistenceContext,
  ): Promise<FingerprintMetadata | null> {
    const data = await runQueryNullable<FingerprintRow>(() =>
      fromTable(this.client, METADATA_TABLES.FINGERPRINTS)
        .select("*")
        .eq("fingerprint_id", fingerprintId as string)
        .maybeSingle(),
    );
    return data ? rowToFingerprint(data) : null;
  }

  async findByTrackId(
    trackId: TrackID,
    _context: PersistenceContext,
  ): Promise<FingerprintMetadata | null> {
    const data = await runQueryNullable<FingerprintRow>(() =>
      fromTable(this.client, METADATA_TABLES.FINGERPRINTS)
        .select("*")
        .eq("track_id", trackId as string)
        .maybeSingle(),
    );
    return data ? rowToFingerprint(data) : null;
  }

  async findByHash(
    hash: string,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly FingerprintMetadata[]> {
    const query = applyPagination(
      fromTable(this.client, METADATA_TABLES.FINGERPRINTS).select("*").eq("hash", hash),
      options,
    );
    const { data, error } = await query;
    if (error) throw error;
    return ((data as FingerprintRow[]) ?? []).map(rowToFingerprint);
  }

  async archive(fingerprintId: FingerprintID, _context: PersistenceContext): Promise<void> {
    const existing = await runQueryNullable<FingerprintRow>(() =>
      fromTable(this.client, METADATA_TABLES.FINGERPRINTS)
        .select("*")
        .eq("fingerprint_id", fingerprintId as string)
        .maybeSingle(),
    );
    if (!existing) throw new NotFoundError();
    await runVoidQuery(() =>
      fromTable(this.client, METADATA_TABLES.FINGERPRINTS)
        .update({
          status: "archived",
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          row_version: existing.row_version + 1,
        })
        .eq("fingerprint_id", fingerprintId as string),
    );
  }
}
