import { describe, expect, it } from "vitest";
import {
  ConfigCountryProvider,
  ConfigFormattingProvider,
  ConfigRegistrantProvider,
  ConfigSequenceProvider,
  ConfigValidationProvider,
  ConfigYearProvider,
  createProviderBundle,
} from "./index";
import { ISO3901_FORMAT_CONFIG, ISRC_PROFILE_CI, ISRC_PROFILE_FR, ISRC_PROFILE_GN } from "../config/defaultFormatConfig";
import { ISRCParserImpl } from "../ISRCParser";
import { ISRCNormalizerImpl } from "../ISRCNormalizer";
import { ISRC_VALIDATION_CODE } from "@sonafrik/types";

describe("ConfigFormattingProvider", () => {
  const formatting = new ConfigFormattingProvider(ISO3901_FORMAT_CONFIG);

  it("strips and builds canonical", () => {
    expect(formatting.stripInput("gn-sfk-24-00001")).toBe("GNSFK2400001");
    expect(
      formatting.buildCanonical({
        country: "GN",
        registrant: "SFK",
        year: "24",
        designation: "00001",
      }),
    ).toBe("GNSFK2400001");
  });

  it("formats display", () => {
    expect(
      formatting.formatDisplay({
        country: "GN",
        registrant: "SFK",
        year: "24",
        designation: "00001",
      }),
    ).toBe("GN-SFK-24-00001");
  });

  it("validates segments from config", () => {
    expect(formatting.validateSegment("country", "GN")).toBe(true);
    expect(formatting.validateSegment("country", "G1")).toBe(false);
  });

  it("exposes designation bounds from config", () => {
    expect(formatting.getMinDesignation()).toBe(1);
    expect(formatting.getMaxDesignation()).toBe(99999);
  });
});

describe("ConfigCountryProvider", () => {
  it("allows any ISO country when no whitelist", () => {
    const formatting = new ConfigFormattingProvider(ISO3901_FORMAT_CONFIG);
    const country = new ConfigCountryProvider(formatting);
    expect(country.isAllowed("FR")).toBe(true);
    expect(country.validate("FR").valid).toBe(true);
  });

  it("restricts to profile whitelist", () => {
    const formatting = new ConfigFormattingProvider(ISRC_PROFILE_GN);
    const country = new ConfigCountryProvider(formatting);
    expect(country.isAllowed("GN")).toBe(true);
    expect(country.isAllowed("FR")).toBe(false);
    expect(country.validate("FR").valid).toBe(false);
  });
});

describe("ConfigRegistrantProvider", () => {
  it("restricts registrant per profile", () => {
    const formatting = new ConfigFormattingProvider(ISRC_PROFILE_GN);
    const registrant = new ConfigRegistrantProvider(formatting);
    expect(registrant.validate("SFK").valid).toBe(true);
    expect(registrant.validate("ABC").valid).toBe(false);
  });
});

describe("ConfigYearProvider", () => {
  it("validates year range from config", () => {
    const formatting = new ConfigFormattingProvider(ISO3901_FORMAT_CONFIG);
    const year = new ConfigYearProvider(formatting);
    expect(year.validate("24").valid).toBe(true);
    expect(year.validate("AA").valid).toBe(false);
    expect(year.resolveCurrentYear()).toMatch(/^\d{2}$/);
  });
});

describe("ConfigSequenceProvider", () => {
  it("increments with config max", async () => {
    const customConfig = {
      ...ISO3901_FORMAT_CONFIG,
      maxDesignation: 3,
      minDesignation: 1,
    };
    const formatting = new ConfigFormattingProvider(customConfig);
    const seq = new ConfigSequenceProvider(formatting);
    const key = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "24" };
    expect(await seq.getNextDesignation(key)).toBe(1);
    expect(await seq.getNextDesignation(key)).toBe(2);
    expect(await seq.getNextDesignation(key)).toBe(3);
    await expect(seq.getNextDesignation(key)).rejects.toThrow();
  });
});

describe("ConfigValidationProvider", () => {
  it("validates components via providers", () => {
    const bundle = createProviderBundle(ISRC_PROFILE_GN);
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

    const components = parser.parse("GN-SFK-24-00001");
    expect(validation.validateComponents(components).valid).toBe(true);

    const bad = { ...components, registrantCode: "ABC" };
    const result = validation.validateComponents(bad);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === ISRC_VALIDATION_CODE.INVALID_REGISTRANT)).toBe(
      true,
    );
  });
});

describe("createProviderBundle", () => {
  it("creates independent bundles per country profile", () => {
    const gn = createProviderBundle(ISRC_PROFILE_GN);
    const ci = createProviderBundle(ISRC_PROFILE_CI);
    const fr = createProviderBundle(ISRC_PROFILE_FR);

    expect(gn.country.isAllowed("GN")).toBe(true);
    expect(gn.country.isAllowed("CI")).toBe(false);
    expect(ci.country.isAllowed("CI")).toBe(true);
    expect(fr.country.isAllowed("FR")).toBe(true);
  });
});
