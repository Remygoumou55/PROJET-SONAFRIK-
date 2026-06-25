/** ISRC format segment definition — configurable, never hardcoded in logic */
export interface ISRCFormatSegment {
  readonly name: "country" | "registrant" | "year" | "designation";
  readonly length: number;
  /** ECMAScript regex source (anchored internally by parser) */
  readonly pattern: string;
}

/** Full ISRC format configuration — ISO 3901 default overridable per territory */
export interface ISRCFormatConfig {
  readonly totalLength: number;
  readonly separator: string | null;
  readonly segments: readonly ISRCFormatSegment[];
  /** Display template using segment names, e.g. "{country}-{registrant}-{year}-{designation}" */
  readonly displayPattern: string;
  /** Optional whitelist of allowed ISO 3166-1 alpha-2 country codes */
  readonly allowedCountryCodes?: readonly string[];
  /** Optional whitelist of allowed registrant codes (exact 3-char match) */
  readonly allowedRegistrantCodes?: readonly string[];
  /** Minimum valid year of reference (2-digit), inclusive */
  readonly minYear?: number;
  /** Maximum valid year of reference (2-digit), inclusive */
  readonly maxYear?: number;
  /** Minimum designation sequence number, inclusive (default 1) */
  readonly minDesignation?: number;
  /** Maximum designation sequence number, inclusive (default 99999) */
  readonly maxDesignation?: number;
  /** Regex source for allowed raw input characters (security) */
  readonly allowedInputPattern?: string;
}
