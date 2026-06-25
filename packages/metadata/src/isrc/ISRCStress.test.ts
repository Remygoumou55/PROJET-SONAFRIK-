import { describe, expect, it } from "vitest";
import { createISRCEngine } from "./ISRCEngine";
import { ISRC_PROFILE_GN } from "./config/defaultFormatConfig";

describe("ISRC stress tests", () => {
  it("generates 1000 unique ISRCs", async () => {
    const engine = createISRCEngine({ config: ISRC_PROFILE_GN });
    const key = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "28" };
    const results: string[] = [];

    for (let i = 0; i < 1000; i++) {
      results.push(await engine.generate(key));
    }

    expect(new Set(results).size).toBe(1000);
  }, 30_000);

  it("validates 5000 inputs under 2 seconds", () => {
    const engine = createISRCEngine({ config: ISRC_PROFILE_GN });
    const start = performance.now();
    for (let i = 1; i <= 5000; i++) {
      const designation = String(i).padStart(5, "0");
      engine.validateFormat(`GN-SFK-28-${designation}`);
    }
    expect(performance.now() - start).toBeLessThan(2000);
  });

  it("idempotent normalize", () => {
    const engine = createISRCEngine({ config: ISRC_PROFILE_GN });
    const once = engine.normalize("GN-SFK-24-00001");
    const twice = engine.normalize(once as string);
    expect(once).toBe(twice);
  });
});
