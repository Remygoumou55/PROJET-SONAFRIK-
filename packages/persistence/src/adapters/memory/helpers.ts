import type { ISRCSequenceKey } from "@sonafrik/types";

export function sequenceKeyString(key: ISRCSequenceKey): string {
  return `${key.countryCode}:${key.registrantCode}:${key.yearOfReference}`;
}
