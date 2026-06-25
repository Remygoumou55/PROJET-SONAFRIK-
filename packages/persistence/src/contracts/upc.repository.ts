import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";

/** UPC registry entry — Phase 3 contract (no generation logic) */
export interface UPCRegistryEntry {
  readonly upc: string;
  readonly status: "available" | "active" | "reserved" | "archived";
  readonly albumId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UPCPersistenceRepository {
  saveEntry(entry: UPCRegistryEntry, context: PersistenceContext): Promise<UPCRegistryEntry>;
  findByValue(upc: string, context: PersistenceContext): Promise<UPCRegistryEntry | null>;
  exists(upc: string, context: PersistenceContext): Promise<boolean>;
  reserve(upc: string, actorId: string, context: PersistenceContext): Promise<UPCRegistryEntry>;
  release(upc: string, context: PersistenceContext): Promise<UPCRegistryEntry>;
  search(
    filter: Readonly<Record<string, unknown>>,
    context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly UPCRegistryEntry[]>;
}
