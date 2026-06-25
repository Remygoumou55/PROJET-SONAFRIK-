import type {
  ISRCRegistryEntry,
  ISRCRegistryStatus,
  ISRCSequenceKey,
  ISRCSequenceState,
  ISRCValue,
} from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";

/** ISRC registry persistence — extends Phase 2 headless contract */
export interface ISRCPersistenceRepository {
  saveEntry(entry: ISRCRegistryEntry, context: PersistenceContext): Promise<ISRCRegistryEntry>;
  findByValue(isrc: ISRCValue, context: PersistenceContext): Promise<ISRCRegistryEntry | null>;
  findByStatus(
    status: ISRCRegistryStatus,
    context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly ISRCRegistryEntry[]>;
  exists(isrc: ISRCValue, context: PersistenceContext): Promise<boolean>;
  deleteEntry(isrc: ISRCValue, context: PersistenceContext): Promise<void>;
  reserve(
    isrc: ISRCValue,
    actorId: string,
    context: PersistenceContext,
  ): Promise<ISRCRegistryEntry>;
  release(isrc: ISRCValue, context: PersistenceContext): Promise<ISRCRegistryEntry>;
  archive(isrc: ISRCValue, context: PersistenceContext): Promise<void>;
}

/** ISRC sequence counter persistence */
export interface ISRCSequencePersistenceRepository {
  getState(key: ISRCSequenceKey, context: PersistenceContext): Promise<ISRCSequenceState | null>;
  saveState(state: ISRCSequenceState, context: PersistenceContext): Promise<ISRCSequenceState>;
  advance(
    key: ISRCSequenceKey,
    context: PersistenceContext,
  ): Promise<ISRCSequenceState>;
}
