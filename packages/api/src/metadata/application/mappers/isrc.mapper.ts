import type { ISRCRegistryEntry } from "@sonafrik/types";
import type { ISRCReservationDto } from "../dto";

export function toISRCReservationDto(entry: ISRCRegistryEntry): ISRCReservationDto {
  return {
    isrc: entry.isrc as string,
    status: entry.status,
    reservedBy: entry.reservedBy,
    reservedAt: entry.reservedAt,
    updatedAt: entry.updatedAt,
  };
}
