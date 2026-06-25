import type { AuditMetadata, AuditMetadataID } from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import type { AuditPersistenceRepository } from "../../contracts/audit.repository";
import { METADATA_TABLES, type SupabaseClientPort } from "./supabase-client.port";
import { applyPagination, fromTable, runQuery, runQueryNullable } from "./supabase-query.helpers";

interface AuditRow {
  id: string;
  audit_metadata_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  status: string;
  source: string;
  visibility: string;
  validation_state: string;
  row_version: number;
  created_at: string;
  updated_at: string;
}

function rowToAudit(row: AuditRow): AuditMetadata {
  return {
    id: row.id as AuditMetadata["id"],
    auditMetadataId: row.audit_metadata_id as AuditMetadataID,
    actorId: row.actor_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    payload: row.payload,
    status: row.status as AuditMetadata["status"],
    source: row.source as AuditMetadata["source"],
    visibility: row.visibility as AuditMetadata["visibility"],
    validationState: row.validation_state as AuditMetadata["validationState"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.row_version,
  };
}

function auditToRow(record: AuditMetadata): Record<string, unknown> {
  return {
    id: record.id as string,
    audit_metadata_id: record.auditMetadataId as string,
    actor_id: record.actorId,
    action: record.action,
    entity_type: record.entityType,
    entity_id: record.entityId,
    payload: record.payload,
    status: record.status,
    source: record.source,
    visibility: record.visibility,
    validation_state: record.validationState,
    row_version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

/** Append-only audit adapter */
export class SupabaseAuditRepositoryAdapter implements AuditPersistenceRepository {
  constructor(private readonly client: SupabaseClientPort) {}

  async append(record: AuditMetadata, _context: PersistenceContext): Promise<AuditMetadata> {
    const data = await runQuery<AuditRow>(() =>
      fromTable(this.client, METADATA_TABLES.AUDIT).insert(auditToRow(record)).select().single(),
    );
    return rowToAudit(data);
  }

  async findById(
    auditId: AuditMetadataID,
    _context: PersistenceContext,
  ): Promise<AuditMetadata | null> {
    const data = await runQueryNullable<AuditRow>(() =>
      fromTable(this.client, METADATA_TABLES.AUDIT)
        .select("*")
        .eq("audit_metadata_id", auditId as string)
        .maybeSingle(),
    );
    return data ? rowToAudit(data) : null;
  }

  async search(
    filter: Readonly<Record<string, unknown>>,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly AuditMetadata[]> {
    let query = fromTable(this.client, METADATA_TABLES.AUDIT).select("*");
    if (filter.actor_id) query = query.eq("actor_id", filter.actor_id);
    if (filter.entity_type) query = query.eq("entity_type", filter.entity_type);
    query = applyPagination(query, options);
    const { data, error } = await query;
    if (error) throw error;
    return ((data as AuditRow[]) ?? []).map(rowToAudit);
  }
}
