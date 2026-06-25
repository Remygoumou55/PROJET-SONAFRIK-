import type { ReleaseMetadata, ReleaseID } from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";

export interface ReleasePersistenceRepository {
  save(release: ReleaseMetadata, context: PersistenceContext): Promise<ReleaseMetadata>;
  findById(releaseId: ReleaseID, context: PersistenceContext): Promise<ReleaseMetadata | null>;
  search(
    filter: Readonly<Record<string, unknown>>,
    context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly ReleaseMetadata[]>;
  archive(releaseId: ReleaseID, context: PersistenceContext): Promise<void>;
}
