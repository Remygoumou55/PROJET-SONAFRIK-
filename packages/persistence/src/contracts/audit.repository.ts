import type { AuditMetadata, AuditMetadataID } from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";

export interface AuditPersistenceRepository {
  append(record: AuditMetadata, context: PersistenceContext): Promise<AuditMetadata>;
  findById(
    auditId: AuditMetadataID,
    context: PersistenceContext,
  ): Promise<AuditMetadata | null>;
  search(
    filter: Readonly<Record<string, unknown>>,
    context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly AuditMetadata[]>;
}
