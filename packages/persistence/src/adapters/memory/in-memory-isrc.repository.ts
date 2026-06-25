import type {
  ISRCRegistryEntry,
  ISRCRegistryStatus,
  ISRCSequenceKey,
  ISRCSequenceState,
  ISRCValue,
} from "@sonafrik/types";
import { ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import type {
  ISRCPersistenceRepository,
  ISRCSequencePersistenceRepository,
} from "../../contracts/isrc.repository";
import { DuplicateError, NotFoundError } from "../../errors/persistence-errors";
import { sequenceKeyString } from "./helpers";

export class InMemoryISRCRepository implements ISRCPersistenceRepository {
  private readonly entries = new Map<string, ISRCRegistryEntry>();

  async saveEntry(
    entry: ISRCRegistryEntry,
    _context: PersistenceContext,
  ): Promise<ISRCRegistryEntry> {
    const key = entry.isrc as string;
    if (this.entries.has(key)) {
      throw new DuplicateError(`ISRC déjà enregistré: ${key}`);
    }
    const stored = Object.freeze({ ...entry });
    this.entries.set(key, stored);
    return stored;
  }

  async findByValue(
    isrc: ISRCValue,
    _context: PersistenceContext,
  ): Promise<ISRCRegistryEntry | null> {
    return this.entries.get(isrc as string) ?? null;
  }

  async findByStatus(
    status: ISRCRegistryStatus,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly ISRCRegistryEntry[]> {
    const all = [...this.entries.values()].filter((e) => e.status === status);
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async exists(isrc: ISRCValue, context: PersistenceContext): Promise<boolean> {
    return (await this.findByValue(isrc, context)) !== null;
  }

  async deleteEntry(isrc: ISRCValue, _context: PersistenceContext): Promise<void> {
    this.entries.delete(isrc as string);
  }

  async reserve(
    isrc: ISRCValue,
    actorId: string,
    _context: PersistenceContext,
  ): Promise<ISRCRegistryEntry> {
    const entry = this.entries.get(isrc as string);
    if (!entry) {
      throw new NotFoundError();
    }
    if (entry.status === ISRC_REGISTRY_STATUS.RESERVED) {
      throw new DuplicateError("ISRC déjà réservé");
    }
    const updated: ISRCRegistryEntry = {
      ...entry,
      status: ISRC_REGISTRY_STATUS.RESERVED,
      reservedBy: actorId,
      reservedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.entries.set(isrc as string, Object.freeze(updated));
    return updated;
  }

  async release(isrc: ISRCValue, _context: PersistenceContext): Promise<ISRCRegistryEntry> {
    const entry = this.entries.get(isrc as string);
    if (!entry) throw new NotFoundError();
    const updated: ISRCRegistryEntry = {
      ...entry,
      status: ISRC_REGISTRY_STATUS.AVAILABLE,
      reservedBy: null,
      reservedAt: null,
      updatedAt: new Date().toISOString(),
    };
    this.entries.set(isrc as string, Object.freeze(updated));
    return updated;
  }

  async archive(isrc: ISRCValue, _context: PersistenceContext): Promise<void> {
    const entry = this.entries.get(isrc as string);
    if (!entry) throw new NotFoundError();
    this.entries.set(
      isrc as string,
      Object.freeze({
        ...entry,
        status: ISRC_REGISTRY_STATUS.ARCHIVED,
        updatedAt: new Date().toISOString(),
      }),
    );
  }
}

export class InMemoryISRCSequenceRepository implements ISRCSequencePersistenceRepository {
  private readonly sequences = new Map<string, ISRCSequenceState>();

  async getState(
    key: ISRCSequenceKey,
    _context: PersistenceContext,
  ): Promise<ISRCSequenceState | null> {
    return this.sequences.get(sequenceKeyString(key)) ?? null;
  }

  async saveState(
    state: ISRCSequenceState,
    _context: PersistenceContext,
  ): Promise<ISRCSequenceState> {
    const mapKey = sequenceKeyString(state.key);
    const stored = Object.freeze({ ...state });
    this.sequences.set(mapKey, stored);
    return stored;
  }

  async advance(
    key: ISRCSequenceKey,
    _context: PersistenceContext,
  ): Promise<ISRCSequenceState> {
    const mapKey = sequenceKeyString(key);
    const current = this.sequences.get(mapKey);
    const next: ISRCSequenceState = {
      key,
      lastDesignation: (current?.lastDesignation ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    this.sequences.set(mapKey, Object.freeze(next));
    return next;
  }
}
