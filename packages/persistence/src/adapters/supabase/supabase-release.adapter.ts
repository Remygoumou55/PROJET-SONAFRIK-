import type { ReleaseID, ReleaseMetadata } from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import type { ReleasePersistenceRepository } from "../../contracts/release.repository";
import { NotFoundError } from "../../errors/persistence-errors";
import { METADATA_TABLES, type SupabaseClientPort } from "./supabase-client.port";
import { applyPagination, fromTable, runQuery, runQueryNullable, runVoidQuery } from "./supabase-query.helpers";

interface ReleaseRow {
  release_id: string;
  creator_id: string | null;
  payload: ReleaseMetadata;
  status: string;
  row_version: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function rowToRelease(row: ReleaseRow): ReleaseMetadata {
  return row.payload;
}

function releaseToRow(release: ReleaseMetadata, creatorId?: string | null): Record<string, unknown> {
  return {
    release_id: release.releaseId as string,
    creator_id: creatorId ?? null,
    payload: release,
    status: release.status,
    row_version: release.version,
    created_at: release.createdAt,
    updated_at: release.updatedAt,
  };
}

export class SupabaseReleaseRepositoryAdapter implements ReleasePersistenceRepository {
  constructor(private readonly client: SupabaseClientPort) {}

  async save(release: ReleaseMetadata, context: PersistenceContext): Promise<ReleaseMetadata> {
    const data = await runQuery<ReleaseRow>(() =>
      fromTable(this.client, METADATA_TABLES.RELEASES)
        .upsert(releaseToRow(release, context.actorId))
        .select()
        .single(),
    );
    return rowToRelease(data);
  }

  async findById(
    releaseId: ReleaseID,
    _context: PersistenceContext,
  ): Promise<ReleaseMetadata | null> {
    const data = await runQueryNullable<ReleaseRow>(() =>
      fromTable(this.client, METADATA_TABLES.RELEASES)
        .select("*")
        .eq("release_id", releaseId as string)
        .maybeSingle(),
    );
    return data ? rowToRelease(data) : null;
  }

  async search(
    filter: Readonly<Record<string, unknown>>,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly ReleaseMetadata[]> {
    let query = fromTable(this.client, METADATA_TABLES.RELEASES).select("*");
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.creator_id) query = query.eq("creator_id", filter.creator_id);
    query = applyPagination(query, options);
    const { data, error } = await query;
    if (error) throw error;
    return ((data as ReleaseRow[]) ?? []).map(rowToRelease);
  }

  async archive(releaseId: ReleaseID, _context: PersistenceContext): Promise<void> {
    const existing = await runQueryNullable<ReleaseRow>(() =>
      fromTable(this.client, METADATA_TABLES.RELEASES)
        .select("*")
        .eq("release_id", releaseId as string)
        .maybeSingle(),
    );
    if (!existing) throw new NotFoundError();
    await runVoidQuery(() =>
      fromTable(this.client, METADATA_TABLES.RELEASES)
        .update({
          status: "archived",
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          row_version: existing.row_version + 1,
        })
        .eq("release_id", releaseId as string),
    );
  }
}
