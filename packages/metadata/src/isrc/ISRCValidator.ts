import type {
  ISRCCountryProvider,
  ISRCFormattingProvider,
  ISRCRegistrantProvider,
  ISRCRegistryEntry,
  ISRCValidationProvider,
  ISRCValidationResult,
  ISRCValue,
  ISRCYearProvider,
} from "@sonafrik/types";

export interface ISRCValidator {
  validateFormat(raw: string): ISRCValidationResult;
  validateRegistryState(isrc: ISRCValue, entry: ISRCRegistryEntry | null): ISRCValidationResult;
}

/** Validator facade — delegates entirely to validation provider */
export class ISRCValidatorImpl implements ISRCValidator {
  constructor(private readonly validation: ISRCValidationProvider) {}

  validateFormat(raw: string): ISRCValidationResult {
    return this.validation.validateInput(raw);
  }

  validateRegistryState(
    isrc: ISRCValue,
    entry: ISRCRegistryEntry | null,
  ): ISRCValidationResult {
    return this.validation.validateRegistryState(isrc, entry);
  }
}

/** @internal re-export for tests */
export type { ISRCCountryProvider, ISRCRegistrantProvider, ISRCYearProvider, ISRCFormattingProvider };
