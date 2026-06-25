import { describe, expect, it } from "vitest";
import { createISRCEngine, createProviderBundle } from "./index";
import {
  ConfigFormattingProvider,
  ConfigValidationProvider,
} from "./providers";
import { ISRCNormalizerImpl } from "./ISRCNormalizer";
import { ISRCParserImpl } from "./ISRCParser";
import { ISRCGeneratorImpl } from "./ISRCGenerator";
import { ISRCSequenceServiceImpl } from "./ISRCSequenceService";
import { ISRCRegistryImpl } from "./ISRCRegistry";
import { ISRCPoolImpl } from "./ISRCPool";
import { ISRCReservationServiceImpl } from "./ISRCReservationService";
import { ISRCAuditServiceImpl } from "./ISRCAuditService";
import { ISO3901_FORMAT_CONFIG, ISRC_PROFILE_GN } from "./config/defaultFormatConfig";
import { ISRC_REGISTRY_STATUS, ISRC_VALIDATION_CODE } from "@sonafrik/types";
import { brandISRC } from "./utils/branding";
import { AsyncMutex } from "./utils/mutex";

describe("ISRC coverage gaps", () => {
  it("normalizer toDisplay", () => {
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG);
    const parser = new ISRCParserImpl(bundle.formatting);
    const normalizer = new ISRCNormalizerImpl(bundle.formatting, parser);
    const canonical = normalizer.normalize("GN-SFK-24-00042");
    expect(normalizer.toDisplay(canonical)).toBe("GN-SFK-24-00042");
  });

  it("generator error paths", () => {
    const bundle = createProviderBundle(ISRC_PROFILE_GN);
    const gen = new ISRCGeneratorImpl(
      bundle.formatting,
      bundle.country,
      bundle.registrant,
      bundle.year,
    );
    const key = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "24" };

    expect(() => gen.generate(key, 0)).toThrow();
    expect(() => gen.generate(key, 100000)).toThrow();
    expect(() =>
      gen.generate({ countryCode: "FR", registrantCode: "SFK", yearOfReference: "24" }, 1),
    ).toThrow();
    expect(() =>
      gen.generate({ countryCode: "GN", registrantCode: "ABC", yearOfReference: "24" }, 1),
    ).toThrow();
    expect(() =>
      gen.generate({ countryCode: "GN", registrantCode: "SFK", yearOfReference: "AA" }, 1),
    ).toThrow();
  });

  it("validation provider input edge cases", () => {
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG);
    const parser = new ISRCParserImpl(bundle.formatting);
    const normalizer = new ISRCNormalizerImpl(bundle.formatting, parser);
    const validation = new ConfigValidationProvider(
      bundle.formatting,
      bundle.country,
      bundle.registrant,
      bundle.year,
      (raw) => parser.parse(raw),
      (raw) => normalizer.normalize(raw),
    );

    expect(validation.validateInput("").valid).toBe(false);
    expect(validation.validateInput("GN-SFK-24-00001<script>").issues.some(
      (i) => i.code === ISRC_VALIDATION_CODE.INVALID_FORMAT,
    )).toBe(true);
    expect(validation.validateInput("INVALID").valid).toBe(false);
    expect(validation.validateRegistryState(brandISRC("GNSFK2400001"), null).valid).toBe(true);
    expect(
      validation.validateRegistryState(brandISRC("GNSFK2400001"), {
        isrc: brandISRC("GNSFK2400002"),
        status: ISRC_REGISTRY_STATUS.AVAILABLE,
        metadataId: null,
        trackId: null,
        reservedBy: null,
        reservedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).valid,
    ).toBe(false);
  });

  it("deprecated sequence service wrapper", async () => {
    const seq = new ISRCSequenceServiceImpl();
    const key = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "29" };
    expect(seq.getState(key)).toBeNull();
    expect(await seq.peek(key)).toBe(1);
    expect(await seq.getNextDesignation(key)).toBe(1);
    await seq.reset(key, 5);
    expect(await seq.getNextDesignation(key)).toBe(6);
  });

  it("registry updateStatus and reservation not found", async () => {
    const registry = new ISRCRegistryImpl();
    const isrc = brandISRC("GNSFK2400099");
    await expect(registry.updateStatus(isrc, ISRC_REGISTRY_STATUS.ACTIVE)).rejects.toThrow();

    await registry.register(isrc);
    await registry.updateStatus(isrc, ISRC_REGISTRY_STATUS.ARCHIVED);
    expect((await registry.lookup(isrc))?.status).toBe(ISRC_REGISTRY_STATUS.ARCHIVED);
  });

  it("pool empty take and contains", async () => {
    const pool = new ISRCPoolImpl();
    expect(await pool.take()).toBeNull();
    const isrc = brandISRC("GNSFK2400100");
    expect(pool.contains(isrc)).toBe(false);
    await pool.add(isrc);
    expect(pool.contains(isrc)).toBe(true);
    expect(pool.size()).toBe(1);
  });

  it("reservation commit from available status", async () => {
    const registry = new ISRCRegistryImpl();
    const audit = new ISRCAuditServiceImpl();
    const reservation = new ISRCReservationServiceImpl(registry, audit);
    const isrc = brandISRC("GNSFK2400101");

    await registry.register(isrc, { status: ISRC_REGISTRY_STATUS.AVAILABLE });
    const committed = await reservation.commit(isrc, "actor", "corr");
    expect(committed.status).toBe(ISRC_REGISTRY_STATUS.ACTIVE);
  });

  it("reservation release errors", async () => {
    const registry = new ISRCRegistryImpl();
    const reservation = new ISRCReservationServiceImpl(registry, new ISRCAuditServiceImpl());
    const isrc = brandISRC("GNSFK2400102");

    await expect(reservation.release(isrc, "a", "c")).rejects.toThrow();
    await registry.register(isrc, { status: ISRC_REGISTRY_STATUS.ACTIVE });
    await expect(reservation.release(isrc, "a", "c")).rejects.toThrow();
  });

  it("engine register invalid throws", async () => {
    const engine = createISRCEngine({ config: ISO3901_FORMAT_CONFIG });
    await expect(engine.register("INVALID" as never)).rejects.toThrow();
  });

  it("engine lookup normalizes input", async () => {
    const engine = createISRCEngine({ config: ISRC_PROFILE_GN });
    const isrc = await engine.generate({
      countryCode: "GN",
      registrantCode: "SFK",
      yearOfReference: "30",
    });
    await engine.register(isrc);
    const entry = await engine.lookup("GN-SFK-30-00001" as never);
    expect(entry?.isrc).toBe(isrc);
  });

  it("formatting provider custom input pattern", () => {
    const formatting = new ConfigFormattingProvider({
      ...ISO3901_FORMAT_CONFIG,
      allowedInputPattern: "^[A-Z0-9-]+$",
    });
    expect(formatting.getAllowedInputPattern().test("GN-SFK-24-00001")).toBe(true);
    expect(formatting.validateSegment("unknown", "XX")).toBe(false);
  });

  it("country provider invalid segment", () => {
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG);
    expect(bundle.country.validate("G1").valid).toBe(false);
    expect(bundle.registrant.validate("A1!").valid).toBe(false);
    expect(bundle.year.validate("XX").valid).toBe(false);
  });

  it("mutex timeout throws", async () => {
    const mutex = new AsyncMutex();
    const release = await mutex.acquire();
    await expect(mutex.acquire(50)).rejects.toThrow("isrc_lock_timeout");
    release();
  });

  it("validation components invalid designation segment", () => {
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG);
    const parser = new ISRCParserImpl(bundle.formatting);
    const components = parser.parse("GN-SFK-24-00001");
    const result = bundle.validation.validateComponents({
      ...components,
      designationCode: "0000A",
    });
    expect(result.issues.some((i) => i.code === ISRC_VALIDATION_CODE.INVALID_DESIGNATION)).toBe(
      true,
    );
  });

  it("validation registry available status is valid", () => {
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG);
    const isrc = brandISRC("GNSFK2400001");
    const result = bundle.validation.validateRegistryState(isrc, {
      isrc,
      status: ISRC_REGISTRY_STATUS.AVAILABLE,
      metadataId: null,
      trackId: null,
      reservedBy: null,
      reservedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.valid).toBe(true);
  });

  it("createProviderBundle with validation override", () => {
    const custom = {
      validateInput: () => ({ valid: true, issues: [] as const }),
      validateComponents: () => ({ valid: true, issues: [] as const }),
      validateRegistryState: () => ({ valid: true, issues: [] as const }),
    };
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG, {
      validation: custom,
    });
    expect(bundle.validation.validateInput("x").valid).toBe(true);
  });

  it("pool addMany and skip existing registry", async () => {
    const registry = new ISRCRegistryImpl();
    const pool = new ISRCPoolImpl(registry);
    const a = brandISRC("GNSFK2400200");
    const b = brandISRC("GNSFK2400201");
    await registry.register(a, { status: ISRC_REGISTRY_STATUS.AVAILABLE });
    await pool.addMany([a, b]);
    expect(pool.size()).toBe(2);
    await pool.add(a);
    expect(pool.size()).toBe(2);
  });

  it("reservation auto-register and isReserved", async () => {
    const registry = new ISRCRegistryImpl();
    const reservation = new ISRCReservationServiceImpl(registry, new ISRCAuditServiceImpl());
    const isrc = brandISRC("GNSFK2400300");
    await reservation.reserve(isrc, "actor", "corr");
    expect(await reservation.isReserved(isrc)).toBe(true);
    await expect(reservation.commit(isrc, "actor", "corr2")).resolves.toBeDefined();
  });

  it("reservation commit not found and invalid status", async () => {
    const registry = new ISRCRegistryImpl();
    const reservation = new ISRCReservationServiceImpl(registry, new ISRCAuditServiceImpl());
    const isrc = brandISRC("GNSFK2400301");
    await expect(reservation.commit(isrc, "a", "c")).rejects.toThrow();
    await registry.register(isrc, { status: ISRC_REGISTRY_STATUS.ARCHIVED });
    await expect(reservation.commit(isrc, "a", "c")).rejects.toThrow();
  });

  it("engine validate returns early on bad format", async () => {
    const engine = createISRCEngine({ config: ISO3901_FORMAT_CONFIG });
    const result = await engine.validate("BAD");
    expect(result.valid).toBe(false);
  });

  it("year provider out of range", () => {
    const formatting = new ConfigFormattingProvider({ ...ISO3901_FORMAT_CONFIG, maxYear: 20 });
    const bundle = createProviderBundle(formatting.config);
    expect(bundle.year.validate("25").valid).toBe(false);
  });

  it("normalizer rejects whitespace-only", () => {
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG);
    const normalizer = new ISRCNormalizerImpl(
      bundle.formatting,
      new ISRCParserImpl(bundle.formatting),
    );
    expect(() => normalizer.normalize("   ")).toThrow();
  });

  it("validateInput non-alphanumeric compact", () => {
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG);
    const result = bundle.validation.validateInput("GN-SFK-24-000!1");
    expect(result.valid).toBe(false);
  });
});
