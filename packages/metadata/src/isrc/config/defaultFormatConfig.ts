import type { ISRCFormatConfig } from "@sonafrik/types";

/** ISO 3901 — generic, no country restriction */
export const ISO3901_FORMAT_CONFIG: ISRCFormatConfig = {
  totalLength: 12,
  separator: "-",
  displayPattern: "{country}-{registrant}-{year}-{designation}",
  allowedInputPattern: "^[A-Za-z0-9\\s-]+$",
  segments: [
    { name: "country", length: 2, pattern: "^[A-Z]{2}$" },
    { name: "registrant", length: 3, pattern: "^[A-Z0-9]{3}$" },
    { name: "year", length: 2, pattern: "^[0-9]{2}$" },
    { name: "designation", length: 5, pattern: "^[0-9]{5}$" },
  ],
  minYear: 0,
  maxYear: 99,
  minDesignation: 1,
  maxDesignation: 99999,
};

/** Build a territory profile by extending ISO 3901 — no logic change, config only */
export function createISRCProfileConfig(
  profileId: string,
  overrides: Partial<ISRCFormatConfig> & Pick<ISRCFormatConfig, "allowedCountryCodes">,
): ISRCFormatConfig & { readonly profileId: string } {
  return {
    ...ISO3901_FORMAT_CONFIG,
    ...overrides,
    profileId,
  };
}

/** Deployment profiles — configuration presets, not business logic */
export const ISRC_PROFILE_GN = createISRCProfileConfig("GN", {
  allowedCountryCodes: ["GN"],
  allowedRegistrantCodes: ["SFK"],
});

export const ISRC_PROFILE_CI = createISRCProfileConfig("CI", {
  allowedCountryCodes: ["CI"],
  allowedRegistrantCodes: ["SFK"],
});

export const ISRC_PROFILE_SN = createISRCProfileConfig("SN", {
  allowedCountryCodes: ["SN"],
  allowedRegistrantCodes: ["SFK"],
});

export const ISRC_PROFILE_GH = createISRCProfileConfig("GH", {
  allowedCountryCodes: ["GH"],
  allowedRegistrantCodes: ["SFK"],
});

export const ISRC_PROFILE_FR = createISRCProfileConfig("FR", {
  allowedCountryCodes: ["FR"],
});

export const ISRC_PROFILE_US = createISRCProfileConfig("US", {
  allowedCountryCodes: ["US"],
});

/** @deprecated Use ISRC_PROFILE_GN — kept for backward compatibility */
export const SONAFRIK_GN_FORMAT_CONFIG = ISRC_PROFILE_GN;
