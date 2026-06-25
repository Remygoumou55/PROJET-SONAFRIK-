import type { CountryCode, ISRCValue } from "../ids";

/** Parsed ISRC components — strongly typed after successful parse */
export interface ISRCComponents {
  readonly countryCode: CountryCode;
  readonly registrantCode: string;
  readonly yearOfReference: string;
  readonly designationCode: string;
  /** Canonical compact form (12 chars, uppercase, no separator) */
  readonly canonical: ISRCValue;
}
