import { describe, expect, it } from "vitest";
import { ConfigFormattingProvider, ConfigSequenceProvider } from "./providers";
import { ISO3901_FORMAT_CONFIG } from "./config/defaultFormatConfig";

describe("ISRCSequenceService", () => {
  const key = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "24" };
  const seq = new ConfigSequenceProvider(new ConfigFormattingProvider(ISO3901_FORMAT_CONFIG));

  it("starts at 1 and increments", async () => {
    expect(await seq.getNextDesignation(key)).toBe(1);
    expect(await seq.getNextDesignation(key)).toBe(2);
    expect(await seq.peek(key)).toBe(3);
  });

  it("resets sequence", async () => {
    await seq.getNextDesignation(key);
    await seq.reset(key, 0);
    expect(await seq.getNextDesignation(key)).toBe(1);
  });

  it("throws when sequence exhausted", async () => {
    const limited = new ConfigSequenceProvider(
      new ConfigFormattingProvider({ ...ISO3901_FORMAT_CONFIG, maxDesignation: 2 }),
    );
    const k = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "25" };
    await limited.reset(k, 1);
    await limited.getNextDesignation(k);
    await expect(limited.getNextDesignation(k)).rejects.toThrow();
  });
});
