import type { ISRCComponents } from "@sonafrik/types";
import type { ISRCFormattingProvider } from "@sonafrik/types";
import { ISRCParseError } from "./errors/ISRCError";
import { brandCountryCode, brandISRC } from "./utils/branding";

export interface ISRCParser {
  parse(raw: string): ISRCComponents;
}

export class ISRCParserImpl implements ISRCParser {
  constructor(private readonly formatting: ISRCFormattingProvider) {}

  parse(raw: string): ISRCComponents {
    const compact = this.formatting.stripInput(raw);

    if (compact.length !== this.formatting.config.totalLength) {
      throw new ISRCParseError(
        `Longueur invalide: attendu ${this.formatting.config.totalLength}, reçu ${compact.length}`,
      );
    }

    const offsets = this.formatting.getSegmentOffsets();
    const parts: Record<string, string> = {};

    for (const segment of this.formatting.config.segments) {
      const { start, end } = offsets[segment.name]!;
      const value = compact.slice(start, end);
      if (!this.formatting.validateSegment(segment.name, value)) {
        throw new ISRCParseError(`Segment "${segment.name}" invalide: "${value}"`);
      }
      parts[segment.name] = value;
    }

    return {
      countryCode: brandCountryCode(parts.country!),
      registrantCode: parts.registrant!,
      yearOfReference: parts.year!,
      designationCode: parts.designation!,
      canonical: brandISRC(compact),
    };
  }
}
