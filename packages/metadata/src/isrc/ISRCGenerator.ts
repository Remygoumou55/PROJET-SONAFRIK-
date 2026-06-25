import type {
  ISRCCountryProvider,
  ISRCFormattingProvider,
  ISRCRegistrantProvider,
  ISRCSequenceKey,
  ISRCValue,
  ISRCYearProvider,
} from "@sonafrik/types";
import { ISRCGenerationError } from "./errors/ISRCError";
import { brandISRC } from "./utils/branding";

export interface ISRCGenerator {
  generate(key: ISRCSequenceKey, designation: number): ISRCValue;
}

export class ISRCGeneratorImpl implements ISRCGenerator {
  constructor(
    private readonly formatting: ISRCFormattingProvider,
    private readonly country: ISRCCountryProvider,
    private readonly registrant: ISRCRegistrantProvider,
    private readonly year: ISRCYearProvider,
  ) {}

  generate(key: ISRCSequenceKey, designation: number): ISRCValue {
    const min = this.formatting.getMinDesignation();
    const max = this.formatting.getMaxDesignation();

    if (designation < min || designation > max) {
      throw new ISRCGenerationError(`Numéro de séquence hors plage (${min}-${max})`);
    }

    const country = key.countryCode.toUpperCase();
    const registrant = key.registrantCode.toUpperCase();
    const year = key.yearOfReference;

    const countryCheck = this.country.validate(country);
    if (!countryCheck.valid) {
      throw new ISRCGenerationError(countryCheck.message ?? "Code pays invalide");
    }

    const registrantCheck = this.registrant.validate(registrant, country);
    if (!registrantCheck.valid) {
      throw new ISRCGenerationError(registrantCheck.message ?? "Code registrant invalide");
    }

    const yearCheck = this.year.validate(year);
    if (!yearCheck.valid) {
      throw new ISRCGenerationError(yearCheck.message ?? "Année invalide");
    }

    const designationCode = String(designation).padStart(5, "0");
    const canonical = this.formatting.buildCanonical({
      country,
      registrant,
      year,
      designation: designationCode,
    });

    if (canonical.length !== this.formatting.config.totalLength) {
      throw new ISRCGenerationError("ISRC généré de longueur incorrecte");
    }

    return brandISRC(canonical);
  }
}
