import type { ISRCFormatConfig } from "./config";
import type { ISRCComponents } from "./components";
import type { ISRCValue } from "../ids";
import type { ISRCRegistryEntry } from "./registry";
import type { ISRCSequenceKey } from "./sequence";
import type { ISRCValidationResult } from "./validation";

/** Result of a single provider validation check */
export interface ISRCProviderCheckResult {
  readonly valid: boolean;
  readonly message?: string;
}

/** Format operations — all rules injected from ISRCFormatConfig */
export interface ISRCFormattingProvider {
  readonly config: ISRCFormatConfig;
  stripInput(raw: string): string;
  buildCanonical(parts: Record<string, string>): string;
  formatDisplay(parts: Record<string, string>): string;
  getSegmentOffsets(): Readonly<Record<string, { start: number; end: number }>>;
  validateSegment(name: string, value: string): boolean;
  getAllowedInputPattern(): RegExp;
  getMinDesignation(): number;
  getMaxDesignation(): number;
}

/** Country code validation — no country hardcoded in consumers */
export interface ISRCCountryProvider {
  validate(countryCode: string): ISRCProviderCheckResult;
  isAllowed(countryCode: string): boolean;
}

/** Registrant code validation */
export interface ISRCRegistrantProvider {
  validate(registrantCode: string, countryCode?: string): ISRCProviderCheckResult;
  isAllowed(registrantCode: string, countryCode?: string): boolean;
}

/** Year of reference validation */
export interface ISRCYearProvider {
  validate(year: string): ISRCProviderCheckResult;
  resolveCurrentYear(): string;
}

/** Sequence allocation — swappable (in-memory, DB, etc.) */
export interface ISRCSequenceProvider {
  getNextDesignation(key: ISRCSequenceKey): Promise<number>;
  peek(key: ISRCSequenceKey): Promise<number>;
  reset(key: ISRCSequenceKey, startAt?: number): Promise<void>;
  getMinDesignation(): number;
  getMaxDesignation(): number;
}

/** Composite validation — delegates to segment providers */
export interface ISRCValidationProvider {
  validateInput(raw: string): ISRCValidationResult;
  validateComponents(components: ISRCComponents): ISRCValidationResult;
  validateRegistryState(isrc: ISRCValue, entry: ISRCRegistryEntry | null): ISRCValidationResult;
}

/** Full injectable provider bundle for ISRCEngine */
export interface ISRCProviderBundle {
  readonly formatting: ISRCFormattingProvider;
  readonly country: ISRCCountryProvider;
  readonly registrant: ISRCRegistrantProvider;
  readonly year: ISRCYearProvider;
  readonly sequence: ISRCSequenceProvider;
  readonly validation: ISRCValidationProvider;
}

/** Engine configuration — providers-only, no hardcoded territory */
export interface ISRCEngineConfig {
  readonly providers: ISRCProviderBundle;
  readonly profileId?: string;
}
