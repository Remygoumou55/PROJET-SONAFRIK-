import type { ISRCFormattingProvider, ISRCProviderCheckResult, ISRCYearProvider } from "@sonafrik/types";

export class ConfigYearProvider implements ISRCYearProvider {
  constructor(private readonly formatting: ISRCFormattingProvider) {}

  validate(year: string): ISRCProviderCheckResult {
    if (!this.formatting.validateSegment("year", year)) {
      return { valid: false, message: "Année invalide" };
    }
    const yearNum = parseInt(year, 10);
    const minYear = this.formatting.config.minYear ?? 0;
    const maxYear = this.formatting.config.maxYear ?? 99;
    if (yearNum < minYear || yearNum > maxYear) {
      return { valid: false, message: `Année hors plage ${minYear}-${maxYear}` };
    }
    return { valid: true };
  }

  resolveCurrentYear(): string {
    return String(new Date().getFullYear() % 100).padStart(2, "0");
  }
}
