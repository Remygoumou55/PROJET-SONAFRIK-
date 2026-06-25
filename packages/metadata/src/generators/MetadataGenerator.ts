import type { ISRCValue, MetadataContext, UPCValue } from "@sonafrik/types";

/** Contract for ISRC/UPC and future identifier generation — Phase 2+ */
export interface MetadataGenerator {
  generateIsrc(context: MetadataContext): Promise<ISRCValue>;
  generateUpc(context: MetadataContext): Promise<UPCValue>;
}
