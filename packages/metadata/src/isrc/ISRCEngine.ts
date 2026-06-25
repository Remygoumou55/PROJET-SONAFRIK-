import type { ISRCProviderBundle, ISRCRegistryEntry, ISRCSequenceKey, ISRCValidationResult, ISRCValue } from "@sonafrik/types";
import { ISRC_AUDIT_ACTION, ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import { ISO3901_FORMAT_CONFIG } from "./config/defaultFormatConfig";
import { ISRCAuditServiceImpl } from "./ISRCAuditService";
import { ISRCGeneratorImpl } from "./ISRCGenerator";
import { ISRCNormalizerImpl } from "./ISRCNormalizer";
import { ISRCParserImpl } from "./ISRCParser";
import { ISRCRegistryImpl } from "./ISRCRegistry";
import { ISRCReservationServiceImpl } from "./ISRCReservationService";
import { ISRCValidatorImpl } from "./ISRCValidator";
import { createProviderBundle } from "./providers/createProviderBundle";
import type { ISRCEngine } from "./repositories/ISRCRepository";

export interface ISRCEngineOptions {
  /** Full provider bundle — preferred for enterprise configuration */
  providers?: ISRCProviderBundle;
  /** Shorthand: build providers from format config (ISO 3901 default) */
  config?: import("@sonafrik/types").ISRCFormatConfig;
  registry?: ISRCRegistryImpl;
  audit?: ISRCAuditServiceImpl;
}

/** Headless ISRC Engine — orchestrates injectable providers */
export class ISRCEngineImpl implements ISRCEngine {
  readonly providers: ISRCProviderBundle;
  readonly parser: ISRCParserImpl;
  readonly normalizer: ISRCNormalizerImpl;
  readonly validator: ISRCValidatorImpl;
  readonly generator: ISRCGeneratorImpl;
  readonly registry: ISRCRegistryImpl;
  readonly reservation: ISRCReservationServiceImpl;
  readonly audit: ISRCAuditServiceImpl;

  constructor(options: ISRCEngineOptions = {}) {
    this.providers =
      options.providers ?? createProviderBundle(options.config ?? ISO3901_FORMAT_CONFIG);

    this.parser = new ISRCParserImpl(this.providers.formatting);
    this.normalizer = new ISRCNormalizerImpl(this.providers.formatting, this.parser);
    this.validator = new ISRCValidatorImpl(this.providers.validation);
    this.generator = new ISRCGeneratorImpl(
      this.providers.formatting,
      this.providers.country,
      this.providers.registrant,
      this.providers.year,
    );
    this.registry = options.registry ?? new ISRCRegistryImpl();
    this.audit = options.audit ?? new ISRCAuditServiceImpl();
    this.reservation = new ISRCReservationServiceImpl(this.registry, this.audit);
  }

  get config() {
    return this.providers.formatting.config;
  }

  parse(raw: string) {
    return this.parser.parse(raw);
  }

  normalize(raw: string): ISRCValue {
    return this.normalizer.normalize(raw);
  }

  validateFormat(raw: string): ISRCValidationResult {
    return this.validator.validateFormat(raw);
  }

  async validate(raw: string): Promise<ISRCValidationResult> {
    const formatResult = this.validator.validateFormat(raw);
    if (!formatResult.valid) return formatResult;

    const canonical = this.normalizer.normalize(raw);
    const entry = await this.registry.lookup(canonical);
    return this.validator.validateRegistryState(canonical, entry);
  }

  async generate(key: ISRCSequenceKey): Promise<ISRCValue> {
    const designation = await this.providers.sequence.getNextDesignation(key);
    const isrc = this.generator.generate(key, designation);

    await this.audit.record(ISRC_AUDIT_ACTION.GENERATED, isrc, "system", correlationId(), {
      key,
      designation,
    });
    await this.audit.record(
      ISRC_AUDIT_ACTION.SEQUENCE_ADVANCED,
      isrc,
      "system",
      correlationId(),
      { designation },
    );

    return isrc;
  }

  async register(isrc: ISRCValue): Promise<ISRCRegistryEntry> {
    const normalized = this.normalizer.normalize(isrc as string);
    const formatCheck = this.validator.validateFormat(normalized as string);
    if (!formatCheck.valid) {
      throw new Error(formatCheck.issues.map((i) => i.message).join("; "));
    }

    const entry = await this.registry.register(normalized, {
      status: ISRC_REGISTRY_STATUS.AVAILABLE,
    });

    await this.audit.record(
      ISRC_AUDIT_ACTION.REGISTERED,
      normalized,
      "system",
      correlationId(),
    );

    return entry;
  }

  async lookup(isrc: ISRCValue): Promise<ISRCRegistryEntry | null> {
    const normalized = this.normalizer.normalize(isrc as string);
    return this.registry.lookup(normalized);
  }

  reserve(isrc: ISRCValue, actorId: string, correlationId: string) {
    const normalized = this.normalizer.normalize(isrc as string);
    return this.reservation.reserve(normalized, actorId, correlationId);
  }

  release(isrc: ISRCValue, actorId: string, correlationId: string) {
    const normalized = this.normalizer.normalize(isrc as string);
    return this.reservation.release(normalized, actorId, correlationId);
  }

  commit(isrc: ISRCValue, actorId: string, correlationId: string) {
    const normalized = this.normalizer.normalize(isrc as string);
    return this.reservation.commit(normalized, actorId, correlationId);
  }
}

function correlationId(): string {
  return `isrc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createISRCEngine(options?: ISRCEngineOptions): ISRCEngineImpl {
  return new ISRCEngineImpl(options);
}
