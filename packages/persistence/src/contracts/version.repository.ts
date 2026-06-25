import type { VersionID, VersionMetadata } from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";

export interface VersionPersistenceRepository {
  save(snapshot: VersionMetadata, context: PersistenceContext): Promise<VersionMetadata>;
  findById(versionId: VersionID, context: PersistenceContext): Promise<VersionMetadata | null>;
  findByEntity(
    entityType: string,
    entityId: string,
    context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly VersionMetadata[]>;
  restore(versionId: VersionID, context: PersistenceContext): Promise<VersionMetadata>;
}
