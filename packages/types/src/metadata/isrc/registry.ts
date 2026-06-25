import type { ISRCValue, MetadataID, TrackID } from "../ids";
import type { ISRCRegistryStatus } from "./enums";

/** Entry stored in the internal ISRC registry */
export interface ISRCRegistryEntry {
  readonly isrc: ISRCValue;
  readonly status: ISRCRegistryStatus;
  readonly metadataId: MetadataID | null;
  readonly trackId: TrackID | null;
  readonly reservedBy: string | null;
  readonly reservedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
