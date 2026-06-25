import type {
  ISRCRegistryEntry,
  ISRCRegistryStatus,
  ISRCValue,
} from "@sonafrik/types";
import type { ISRCRepository } from "./ISRCRepository";

/** In-memory repository — headless persistence for tests and Phase 3 adapter reference */
export class InMemoryISRCRepository implements ISRCRepository {
  private readonly store = new Map<string, ISRCRegistryEntry>();

  async saveEntry(entry: ISRCRegistryEntry): Promise<void> {
    this.store.set(entry.isrc as string, Object.freeze({ ...entry }));
  }

  async findByValue(isrc: ISRCValue): Promise<ISRCRegistryEntry | null> {
    return this.store.get(isrc as string) ?? null;
  }

  async findByStatus(status: ISRCRegistryStatus): Promise<readonly ISRCRegistryEntry[]> {
    return [...this.store.values()].filter((e) => e.status === status);
  }

  async deleteEntry(isrc: ISRCValue): Promise<void> {
    this.store.delete(isrc as string);
  }

  size(): number {
    return this.store.size;
  }
}
