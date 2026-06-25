import { describe, expect, it } from "vitest";
import { createISRCEngine } from "./ISRCEngine";
import { ISO3901_FORMAT_CONFIG, ISRC_PROFILE_GN } from "./config/defaultFormatConfig";

describe("ISRCParser", () => {
  const engine = createISRCEngine({ config: ISO3901_FORMAT_CONFIG });

  it("parses hyphenated ISRC", () => {
    const result = engine.parse("GN-SFK-24-00001");
    expect(result.countryCode).toBe("GN");
    expect(result.canonical).toBe("GNSFK2400001");
  });

  it("parses compact ISRC", () => {
    expect(engine.parse("GNSFK2400001").canonical).toBe("GNSFK2400001");
  });

  it("parses lowercase input", () => {
    expect(engine.parse("gn-sfk-24-00001").canonical).toBe("GNSFK2400001");
  });

  it("rejects invalid length", () => {
    expect(() => engine.parse("GN-SFK-24-0001")).toThrow();
  });

  it("rejects invalid country segment", () => {
    expect(() => engine.parse("G1-SFK-24-00001")).toThrow();
  });

  it("rejects invalid designation", () => {
    expect(() => engine.parse("GN-SFK-24-0000A")).toThrow();
  });
});

describe("ISRCNormalizer", () => {
  const engine = createISRCEngine({ config: ISO3901_FORMAT_CONFIG });

  it("normalizes hyphenated to canonical", () => {
    expect(engine.normalize("GN-SFK-24-00001")).toBe("GNSFK2400001");
  });

  it("normalizes with spaces", () => {
    expect(engine.normalize("GN SFK 24 00001")).toBe("GNSFK2400001");
  });

  it("rejects injection characters", () => {
    expect(() => engine.normalize("GN-SFK-24-00001'; DROP TABLE--")).toThrow();
  });

  it("rejects empty input", () => {
    expect(() => engine.normalize("")).toThrow();
  });
});

describe("ISRCGenerator", () => {
  const engine = createISRCEngine({ config: ISRC_PROFILE_GN });
  const key = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "24" };

  it("generates via engine providers", async () => {
    const isrc = await engine.generate(key);
    expect(isrc).toBe("GNSFK2400001");
  });
});
