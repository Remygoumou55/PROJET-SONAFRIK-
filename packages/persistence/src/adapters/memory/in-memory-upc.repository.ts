import type { UPCRegistryEntry } from "../../contracts/upc.repository";
import type { UPCPersistenceRepository } from "../../contracts/upc.repository";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import { DuplicateError, NotFoundError } from "../../errors/persistence-errors";

export class InMemoryUPCRepository implements UPCPersistenceRepository {
  private readonly entries = new Map<string, UPCRegistryEntry>();

  async saveEntry(
    entry: UPCRegistryEntry,
    _context: PersistenceContext,
  ): Promise<UPCRegistryEntry> {
    if (this.entries.has(entry.upc)) {
      throw new DuplicateError();
    }
    const stored = Object.freeze({ ...entry });
    this.entries.set(entry.upc, stored);
    return stored;
  }

  async findByValue(upc: string, _context: PersistenceContext): Promise<UPCRegistryEntry | null> {
    return this.entries.get(upc) ?? null;
  }

  async exists(upc: string, context: PersistenceContext): Promise<boolean> {
    return (await this.findByValue(upc, context)) !== null;
  }

  async reserve(
    upc: string,
    _actorId: string,
    _context: PersistenceContext,
  ): Promise<UPCRegistryEntry> {
    const entry = this.entries.get(upc);
    if (!entry) throw new NotFoundError();
    const updated = Object.freeze({ ...entry, status: "reserved" as const });
    this.entries.set(upc, updated);
    return updated;
  }

  async release(upc: string, _context: PersistenceContext): Promise<UPCRegistryEntry> {
    const entry = this.entries.get(upc);
    if (!entry) throw new NotFoundError();
    const updated = Object.freeze({ ...entry, status: "available" as const });
    this.entries.set(upc, updated);
    return updated;
  }

  async search(
    filter: Readonly<Record<string, unknown>>,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly UPCRegistryEntry[]> {
    let results = [...this.entries.values()];
    if (filter.status) {
      results = results.filter((e) => e.status === filter.status);
    }
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? results.length;
    return results.slice(offset, offset + limit);
  }
}
