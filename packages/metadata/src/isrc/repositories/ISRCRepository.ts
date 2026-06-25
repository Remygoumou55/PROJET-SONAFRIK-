import type {
  ISRCFormatConfig,
  ISRCRegistryEntry,
  ISRCSequenceKey,
  ISRCValidationResult,
  ISRCValue,
} from "@sonafrik/types";

/** Persistence abstraction — Phase 3+ Supabase adapter in packages/api */
export interface ISRCRepository {
  saveEntry(entry: ISRCRegistryEntry): Promise<void>;
  findByValue(isrc: ISRCValue): Promise<ISRCRegistryEntry | null>;
  findByStatus(status: ISRCRegistryEntry["status"]): Promise<readonly ISRCRegistryEntry[]>;
  deleteEntry(isrc: ISRCValue): Promise<void>;
}

export interface ISRCEngine {
  readonly config: ISRCFormatConfig;
  parse(raw: string): ReturnType<import("../ISRCParser").ISRCParser["parse"]>;
  normalize(raw: string): ISRCValue;
  /** Synchronous format-only validation */
  validateFormat(raw: string): ISRCValidationResult;
  /** Async validation including registry state (duplicates, reserved, etc.) */
  validate(raw: string): Promise<ISRCValidationResult>;
  generate(key: ISRCSequenceKey): Promise<ISRCValue>;
  register(isrc: ISRCValue): Promise<ISRCRegistryEntry>;
  lookup(isrc: ISRCValue): Promise<ISRCRegistryEntry | null>;
  reserve(isrc: ISRCValue, actorId: string, correlationId: string): Promise<ISRCRegistryEntry>;
  release(isrc: ISRCValue, actorId: string, correlationId: string): Promise<ISRCRegistryEntry>;
  commit(isrc: ISRCValue, actorId: string, correlationId: string): Promise<ISRCRegistryEntry>;
}
