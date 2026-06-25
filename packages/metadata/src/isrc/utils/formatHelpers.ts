import type { ISRCFormatConfig } from "@sonafrik/types";

export function segmentOffsets(
  config: ISRCFormatConfig,
): Readonly<Record<string, { start: number; end: number }>> {
  const offsets: Record<string, { start: number; end: number }> = {};
  let cursor = 0;

  for (const segment of config.segments) {
    offsets[segment.name] = { start: cursor, end: cursor + segment.length };
    cursor += segment.length;
  }

  return offsets;
}

export function formatDisplay(
  config: ISRCFormatConfig,
  parts: Record<string, string>,
): string {
  return config.displayPattern.replace(/\{(\w+)\}/g, (_, key: string) => parts[key] ?? "");
}

export function buildCanonical(
  config: ISRCFormatConfig,
  parts: Record<string, string>,
): string {
  return config.segments.map((s) => parts[s.name] ?? "").join("");
}

export function sequenceKeyString(country: string, registrant: string, year: string): string {
  return `${country}:${registrant}:${year}`;
}
