import type { ISRCFormattingProvider, ISRCValue } from "@sonafrik/types";
import { ISRCParseError } from "./errors/ISRCError";
import type { ISRCParser } from "./ISRCParser";
import { brandISRC } from "./utils/branding";

export interface ISRCNormalizer {
  normalize(raw: string): ISRCValue;
  toDisplay(isrc: ISRCValue): string;
}

export class ISRCNormalizerImpl implements ISRCNormalizer {
  constructor(
    private readonly formatting: ISRCFormattingProvider,
    private readonly parser: ISRCParser,
  ) {}

  normalize(raw: string): ISRCValue {
    if (!raw || typeof raw !== "string") {
      throw new ISRCParseError("Entrée ISRC vide ou invalide");
    }

    const sanitized = raw.trim();
    if (sanitized.length === 0) {
      throw new ISRCParseError("Entrée ISRC vide");
    }

    if (!this.formatting.getAllowedInputPattern().test(sanitized)) {
      throw new ISRCParseError("Caractères non autorisés dans l'ISRC");
    }

    const components = this.parser.parse(sanitized);
    return brandISRC(
      this.formatting.buildCanonical({
        country: components.countryCode as string,
        registrant: components.registrantCode,
        year: components.yearOfReference,
        designation: components.designationCode,
      }),
    );
  }

  toDisplay(isrc: ISRCValue): string {
    const components = this.parser.parse(isrc as string);
    return this.formatting.formatDisplay({
      country: components.countryCode as string,
      registrant: components.registrantCode,
      year: components.yearOfReference,
      designation: components.designationCode,
    });
  }
}
