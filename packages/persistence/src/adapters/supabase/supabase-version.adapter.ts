import type { VersionID, VersionMetadata } from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import type { VersionPersistenceRepository } from "../../contracts/version.repository";
import { NotFoundError } from "../../errors/persistence-errors";
import { METADATA_TABLES, type SupabaseClientPort } from "./supabase-client.port";
import { applyPagination, fromTable, runQuery, runQueryNullable } from "./supabase-query.helpers";

interface VersionRow {
  version_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  snapshot: Record<string, unknown>;
  creator_id: string | null;
  status: string;
  source: string;
  visibility: string;
  validation_state: string;
  row_version: number;
  created_at: string;
  updated_at: string;
}

function rowToVersion(row: VersionRow): VersionMetadata {
  return {
    id: row.version_id as VersionMetadata["id"],
    versionId: row.version_id as VersionID,
    entityType: row.entity_type as VersionMetadata["entityType"],
    entityId: row.entity_id,
    action: row.action as VersionMetadata["action"],
    snapshot: row.snapshot,
    status: row.status as VersionMetadata["status"],
    source: row.source as VersionMetadata["source"],
    visibility: row.visibility as VersionMetadata["visibility"],
    validationState: row.validation_state as VersionMetadata["validationState"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.row_version,
  };
}

function versionToRow(snapshot: VersionMetadata, creatorId?: string | null): Record<string, unknown> {
  return {
    version_id: snapshot.versionId as string,
    entity_type: snapshot.entityType,
    entity_id: snapshot.entityId,
    action: snapshot.action,
    snapshot: snapshot.snapshot,
    creator_id: creatorId ?? null,
    status: snapshot.status,
    source: snapshot.source,
    visibility: snapshot.visibility,
    validation_state: snapshot.validationState,
    row_version: snapshot.version,
    created_at: snapshot.createdAt,
    updated_at: snapshot.updatedAt,
  };
}

export class SupabaseVersionRepositoryAdapter implements VersionPersistenceRepository {
  constructor(private readonly client: SupabaseClientPort) {}

  async save(snapshot: VersionMetadata, context: PersistenceContext): Promise<VersionMetadata> {
    const data = await runQuery<VersionRow>(() =>
      fromTable(this.client, METADATA_TABLES.VERSIONS)
        .upsert(versionToRow(snapshot, context.actorId))
        .select()
        .single(),
    );
    return rowToVersion(data);
  }

  async findById(
    versionId: VersionID,
    _context: PersistenceContext,
  ): Promise<VersionMetadata | null> {
    const data = await runQueryNullable<VersionRow>(() =>
      fromTable(this.client, METADATA_TABLES.VERSIONS)
        .select("*")
        .eq("version_id", versionId as string)
        .maybeSingle(),
    );
    return data ? rowToVersion(data) : null;
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly VersionMetadata[]> {
    const query = applyPagination(
      fromTable(this.client, METADATA_TABLES.VERSIONS)
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false }),
      options,
    );
    const { data, error } = await query;
    if (error) throw error;
    return ((data as VersionRow[]) ?? []).map(rowToVersion);
  }

  async restore(versionId: VersionID, context: PersistenceContext): Promise<VersionMetadata> {
    const existing = await this.findById(versionId, context);
    if (!existing) throw new NotFoundError();
    return existing;
  }
}
