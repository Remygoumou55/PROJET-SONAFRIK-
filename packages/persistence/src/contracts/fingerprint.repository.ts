import type { FingerprintID, FingerprintMetadata, TrackID } from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";

export interface FingerprintPersistenceRepository {
  save(
    record: FingerprintMetadata,
    context: PersistenceContext,
  ): Promise<FingerprintMetadata>;
  findById(
    fingerprintId: FingerprintID,
    context: PersistenceContext,
  ): Promise<FingerprintMetadata | null>;
  findByTrackId(
    trackId: TrackID,
    context: PersistenceContext,
  ): Promise<FingerprintMetadata | null>;
  findByHash(
    hash: string,
    context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly FingerprintMetadata[]>;
  archive(fingerprintId: FingerprintID, context: PersistenceContext): Promise<void>;
}
