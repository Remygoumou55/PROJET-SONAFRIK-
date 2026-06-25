import type { ISRCValue, MetadataID } from "@sonafrik/types";
import type { PersistenceContext } from "@sonafrik/types";
import type { RegistryPersistenceRepository } from "../../contracts/registry.repository";
import { NotFoundError } from "../../errors/persistence-errors";

export class InMemoryRegistryRepository implements RegistryPersistenceRepository {
  private readonly isrcIndex = new Map<string, MetadataID>();
  private readonly upcIndex = new Map<string, MetadataID>();

  async registerIsrc(
    isrc: ISRCValue,
    metadataId: MetadataID,
    _context: PersistenceContext,
  ): Promise<void> {
    this.isrcIndex.set(isrc as string, metadataId);
  }

  async lookupByIsrc(
    isrc: ISRCValue,
    _context: PersistenceContext,
  ): Promise<MetadataID | null> {
    return this.isrcIndex.get(isrc as string) ?? null;
  }

  async registerUpc(
    upc: string,
    metadataId: MetadataID,
    _context: PersistenceContext,
  ): Promise<void> {
    this.upcIndex.set(upc, metadataId);
  }

  async lookupByUpc(upc: string, _context: PersistenceContext): Promise<MetadataID | null> {
    return this.upcIndex.get(upc) ?? null;
  }

  async unregister(metadataId: MetadataID, _context: PersistenceContext): Promise<void> {
    let found = false;
    for (const [k, v] of this.isrcIndex) {
      if (v === metadataId) {
        this.isrcIndex.delete(k);
        found = true;
      }
    }
    for (const [k, v] of this.upcIndex) {
      if (v === metadataId) {
        this.upcIndex.delete(k);
        found = true;
      }
    }
    if (!found) {
      throw new NotFoundError();
    }
  }
}
