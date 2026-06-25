import { describe, expect, it } from "vitest";
import { measureISRCPerformance } from "./performanceMetrics";
import { brandISRC, brandCountryCode, unbrandISRC } from "./branding";
import { segmentOffsets, formatDisplay, buildCanonical, sequenceKeyString } from "./formatHelpers";
import { ISO3901_FORMAT_CONFIG } from "../config/defaultFormatConfig";
import { AsyncMutex } from "./mutex";
import {
  ISRCError,
  ISRCParseError,
  ISRCValidationError,
  ISRCGenerationError,
  ISRCReservationError,
} from "../errors/ISRCError";

describe("utils", () => {
  it("branding helpers", () => {
    const isrc = brandISRC("GNSFK2400001");
    expect(unbrandISRC(isrc)).toBe("GNSFK2400001");
    expect(brandCountryCode("GN")).toBe("GN");
  });

  it("formatHelpers", () => {
    const offsets = segmentOffsets(ISO3901_FORMAT_CONFIG);
    expect(offsets.country?.start).toBe(0);
    expect(
      buildCanonical(ISO3901_FORMAT_CONFIG, {
        country: "GN",
        registrant: "SFK",
        year: "24",
        designation: "00001",
      }),
    ).toBe("GNSFK2400001");
    expect(
      formatDisplay(ISO3901_FORMAT_CONFIG, {
        country: "GN",
        registrant: "SFK",
        year: "24",
        designation: "00001",
      }),
    ).toBe("GN-SFK-24-00001");
    expect(sequenceKeyString("GN", "SFK", "24")).toBe("GN:SFK:24");
  });

  it("AsyncMutex serializes access", async () => {
    const mutex = new AsyncMutex();
    const order: number[] = [];
    await Promise.all([
      mutex.run(async () => {
        order.push(1);
        await new Promise((r) => setTimeout(r, 10));
      }),
      mutex.run(async () => order.push(2)),
    ]);
    expect(order).toEqual([1, 2]);
  });

  it("ISRC error classes", () => {
    expect(new ISRCParseError("x").code).toBe("isrc_parse_failed");
    expect(new ISRCValidationError().name).toBe("ISRCValidationError");
    expect(new ISRCGenerationError().code).toBe("isrc_generation_failed");
    expect(new ISRCReservationError().code).toBe("isrc_reservation_conflict");
    expect(new ISRCError("isrc_not_found").code).toBe("isrc_not_found");
  });
});

describe("performance metrics", () => {
  it("measures operations under threshold", async () => {
    const metrics = await measureISRCPerformance(20);
    expect(metrics.parseMs).toBeLessThan(5);
    expect(metrics.normalizeMs).toBeLessThan(5);
    expect(metrics.validateFormatMs).toBeLessThan(10);
    expect(metrics.generateMs).toBeLessThan(20);
    expect(metrics.iterations).toBe(20);
  });
});
