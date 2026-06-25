import type { ISRCCountryProvider, ISRCFormattingProvider, ISRCProviderCheckResult } from "@sonafrik/types";

export class ConfigCountryProvider implements ISRCCountryProvider {
  constructor(private readonly formatting: ISRCFormattingProvider) {}

  validate(countryCode: string): ISRCProviderCheckResult {
    const code = countryCode.toUpperCase();
    if (!this.formatting.validateSegment("country", code)) {
      return { valid: false, message: "Code pays invalide" };
    }
    if (!this.isAllowed(code)) {
      return { valid: false, message: `Code pays non autorisé: ${code}` };
    }
    return { valid: true };
  }

  isAllowed(countryCode: string): boolean {
    const whitelist = this.formatting.config.allowedCountryCodes;
    if (!whitelist || whitelist.length === 0) return true;
    return whitelist.includes(countryCode.toUpperCase());
  }
}
