import type { ISRCProviderCheckResult, ISRCRegistrantProvider, ISRCFormattingProvider } from "@sonafrik/types";

export class ConfigRegistrantProvider implements ISRCRegistrantProvider {
  constructor(private readonly formatting: ISRCFormattingProvider) {}

  validate(registrantCode: string, _countryCode?: string): ISRCProviderCheckResult {
    const code = registrantCode.toUpperCase();
    if (!this.formatting.validateSegment("registrant", code)) {
      return { valid: false, message: "Code registrant invalide" };
    }
    if (!this.isAllowed(code)) {
      return { valid: false, message: `Code registrant non autorisé: ${code}` };
    }
    return { valid: true };
  }

  isAllowed(registrantCode: string, _countryCode?: string): boolean {
    const whitelist = this.formatting.config.allowedRegistrantCodes;
    if (!whitelist || whitelist.length === 0) return true;
    return whitelist.includes(registrantCode.toUpperCase());
  }
}
