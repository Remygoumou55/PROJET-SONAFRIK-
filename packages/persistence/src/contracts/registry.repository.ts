import type { ISRCValue } from "@sonafrik/types";
import type { MetadataID } from "@sonafrik/types";
import type { PersistenceContext } from "@sonafrik/types";

/** Cross-identifier registry index — ISRC, UPC lookups */
export interface RegistryPersistenceRepository {
  registerIsrc(
    isrc: ISRCValue,
    metadataId: MetadataID,
    context: PersistenceContext,
  ): Promise<void>;
  lookupByIsrc(isrc: ISRCValue, context: PersistenceContext): Promise<MetadataID | null>;
  registerUpc(upc: string, metadataId: MetadataID, context: PersistenceContext): Promise<void>;
  lookupByUpc(upc: string, context: PersistenceContext): Promise<MetadataID | null>;
  unregister(metadataId: MetadataID, context: PersistenceContext): Promise<void>;
}
