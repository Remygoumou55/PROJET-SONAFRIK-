import type {
  ISRCRegistryEntry,
  ISRCRegistryStatus,
  ISRCValue,
  MetadataID,
  TrackID,
} from "@sonafrik/types";
import { ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import { ISRCError } from "./errors/ISRCError";
import { AsyncMutex } from "./utils/mutex";

export interface ISRCRegistry {
  register(
    isrc: ISRCValue,
    options?: {
      metadataId?: MetadataID | null;
      trackId?: TrackID | null;
      status?: ISRCRegistryStatus;
    },
  ): Promise<ISRCRegistryEntry>;
  lookup(isrc: ISRCValue): Promise<ISRCRegistryEntry | null>;
  exists(isrc: ISRCValue): Promise<boolean>;
  updateStatus(isrc: ISRCValue, status: ISRCRegistryStatus): Promise<ISRCRegistryEntry>;
  findByStatus(status: ISRCRegistryStatus): Promise<readonly ISRCRegistryEntry[]>;
  count(): number;
}

export class ISRCRegistryImpl implements ISRCRegistry {
  private readonly store = new Map<string, ISRCRegistryEntry>();
  private readonly mutex = new AsyncMutex();

  async register(
    isrc: ISRCValue,
    options: {
      metadataId?: MetadataID | null;
      trackId?: TrackID | null;
      status?: ISRCRegistryStatus;
    } = {},
  ): Promise<ISRCRegistryEntry> {
    return this.mutex.run(async () => {
      const key = isrc as string;
      if (this.store.has(key)) {
        throw new ISRCError("isrc_duplicate", `ISRC déjà enregistré: ${key}`);
      }

      const now = new Date().toISOString();
      const entry: ISRCRegistryEntry = {
        isrc,
        status: options.status ?? ISRC_REGISTRY_STATUS.ACTIVE,
        metadataId: options.metadataId ?? null,
        trackId: options.trackId ?? null,
        reservedBy: null,
        reservedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      this.store.set(key, entry);
      return entry;
    });
  }

  async lookup(isrc: ISRCValue): Promise<ISRCRegistryEntry | null> {
    return this.store.get(isrc as string) ?? null;
  }

  async exists(isrc: ISRCValue): Promise<boolean> {
    return this.store.has(isrc as string);
  }

  async updateStatus(isrc: ISRCValue, status: ISRCRegistryStatus): Promise<ISRCRegistryEntry> {
    return this.mutex.run(async () => {
      const entry = this.store.get(isrc as string);
      if (!entry) {
        throw new ISRCError("isrc_not_found");
      }

      const updated: ISRCRegistryEntry = {
        ...entry,
        status,
        updatedAt: new Date().toISOString(),
      };
      this.store.set(isrc as string, updated);
      return updated;
    });
  }

  async findByStatus(status: ISRCRegistryStatus): Promise<readonly ISRCRegistryEntry[]> {
    return [...this.store.values()].filter((e) => e.status === status);
  }

  count(): number {
    return this.store.size;
  }

  /** Internal: update reservation fields */
  async setReservation(
    isrc: ISRCValue,
    reservedBy: string | null,
    status: ISRCRegistryStatus,
  ): Promise<ISRCRegistryEntry> {
    return this.mutex.run(async () => {
      const entry = this.store.get(isrc as string);
      if (!entry) {
        throw new ISRCError("isrc_not_found");
      }

      const updated: ISRCRegistryEntry = {
        ...entry,
        status,
        reservedBy,
        reservedAt: reservedBy ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      };
      this.store.set(isrc as string, updated);
      return updated;
    });
  }
}
