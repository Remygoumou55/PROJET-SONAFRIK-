import { describe, expect, it } from "vitest";
import { ISRC_VALIDATION_CODE, ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import { createISRCEngine, createProviderBundle } from "./index";
import { ISO3901_FORMAT_CONFIG, ISRC_PROFILE_GN } from "./config/defaultFormatConfig";
import { brandISRC } from "./utils/branding";

describe("ISRCValidator", () => {
  const engine = createISRCEngine({ config: ISO3901_FORMAT_CONFIG });
  const gnEngine = createISRCEngine({ config: ISRC_PROFILE_GN });

  it("accepts valid ISRC", () => {
    expect(engine.validateFormat("GN-SFK-24-00001").valid).toBe(true);
  });

  it("detects invalid length", () => {
    const result = engine.validateFormat("GN-SFK-24-0001");
    expect(result.issues.some((i) => i.code === ISRC_VALIDATION_CODE.INVALID_LENGTH)).toBe(true);
  });

  it("detects invalid country with GN profile", () => {
    const result = gnEngine.validateFormat("FR-SFK-24-00001");
    expect(result.issues.some((i) => i.code === ISRC_VALIDATION_CODE.INVALID_COUNTRY_CODE)).toBe(
      true,
    );
  });

  it("detects invalid registrant with GN profile", () => {
    const result = gnEngine.validateFormat("GN-ABC-24-00001");
    expect(result.issues.some((i) => i.code === ISRC_VALIDATION_CODE.INVALID_REGISTRANT)).toBe(
      true,
    );
  });

  it("detects invalid designation zero", () => {
    const result = engine.validateFormat("GN-SFK-24-00000");
    expect(result.issues.some((i) => i.code === ISRC_VALIDATION_CODE.INVALID_DESIGNATION)).toBe(
      true,
    );
  });

  it("detects registry duplicate", () => {
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG);
    const isrc = brandISRC("GNSFK2400001");
    const result = bundle.validation.validateRegistryState(isrc, {
      isrc,
      status: ISRC_REGISTRY_STATUS.ACTIVE,
      metadataId: null,
      trackId: null,
      reservedBy: null,
      reservedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.issues.some((i) => i.code === ISRC_VALIDATION_CODE.DUPLICATE)).toBe(true);
  });

  it("detects reserved, archived, deleted", () => {
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG);
    const isrc = brandISRC("GNSFK2400001");
    const base = {
      isrc,
      metadataId: null,
      trackId: null,
      reservedBy: null,
      reservedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(
      bundle.validation.validateRegistryState(isrc, { ...base, status: ISRC_REGISTRY_STATUS.RESERVED })
        .issues[0]?.code,
    ).toBe(ISRC_VALIDATION_CODE.RESERVED);
    expect(
      bundle.validation.validateRegistryState(isrc, { ...base, status: ISRC_REGISTRY_STATUS.ARCHIVED })
        .issues[0]?.code,
    ).toBe(ISRC_VALIDATION_CODE.ARCHIVED);
    expect(
      bundle.validation.validateRegistryState(isrc, { ...base, status: ISRC_REGISTRY_STATUS.DELETED })
        .issues[0]?.code,
    ).toBe(ISRC_VALIDATION_CODE.DELETED);
  });

  it("detects registry entry mismatch", () => {
    const bundle = createProviderBundle(ISO3901_FORMAT_CONFIG);
    const isrc = brandISRC("GNSFK2400001");
    const result = bundle.validation.validateRegistryState(isrc, {
      isrc: brandISRC("GNSFK2400002"),
      status: ISRC_REGISTRY_STATUS.AVAILABLE,
      metadataId: null,
      trackId: null,
      reservedBy: null,
      reservedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.valid).toBe(false);
  });
});
