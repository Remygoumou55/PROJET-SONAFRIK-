import { describe, expect, it } from "vitest";
import { createISRCEngine } from "./ISRCEngine";
import {
  ISRC_PROFILE_CI,
  ISRC_PROFILE_FR,
  ISRC_PROFILE_GH,
  ISRC_PROFILE_GN,
  ISRC_PROFILE_SN,
  ISRC_PROFILE_US,
} from "./config/defaultFormatConfig";
import { ISRC_VALIDATION_CODE } from "@sonafrik/types";

describe("ISRCEngine", () => {
  const engine = createISRCEngine({ config: ISRC_PROFILE_GN });
  const key = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "24" };

  it("generates sequential unique ISRCs", async () => {
    const first = await engine.generate(key);
    const second = await engine.generate(key);
    expect(first).toBe("GNSFK2400001");
    expect(second).toBe("GNSFK2400002");
  });

  it("detects duplicate after commit", async () => {
    const isrc = await engine.generate(key);
    await engine.register(isrc);
    await engine.reserve(isrc, "actor", "corr-1");
    await engine.commit(isrc, "actor", "corr-1");
    const validation = await engine.validate(isrc as string);
    expect(validation.issues.some((i) => i.code === ISRC_VALIDATION_CODE.DUPLICATE)).toBe(true);
  });

  it("full reservation workflow", async () => {
    const fresh = await engine.generate(key);
    await engine.register(fresh);
    await engine.reserve(fresh, "user-a", "session-1");
    await engine.release(fresh, "user-a", "session-1");
    await engine.reserve(fresh, "user-a", "session-2");
    await engine.commit(fresh, "user-a", "session-2");
  });
});

describe("ISRCEngine multi-profile", () => {
  const profiles = [
    { profile: ISRC_PROFILE_GN, country: "GN", registrant: "SFK" },
    { profile: ISRC_PROFILE_CI, country: "CI", registrant: "SFK" },
    { profile: ISRC_PROFILE_SN, country: "SN", registrant: "SFK" },
    { profile: ISRC_PROFILE_GH, country: "GH", registrant: "SFK" },
    { profile: ISRC_PROFILE_FR, country: "FR", registrant: "ABC" },
    { profile: ISRC_PROFILE_US, country: "US", registrant: "XYZ" },
  ];

  it.each(profiles)("generates for $country profile", async ({ profile, country, registrant }) => {
    const eng = createISRCEngine({ config: profile });
    const isrc = await eng.generate({
      countryCode: country,
      registrantCode: registrant,
      yearOfReference: "26",
    });
    expect(isrc.startsWith(`${country}${registrant}26`)).toBe(true);
  });
});

describe("ISRCEngine concurrency", () => {
  it("handles 50 parallel generations without collision", async () => {
    const engine = createISRCEngine({ config: ISRC_PROFILE_GN });
    const key = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "27" };
    const results = await Promise.all(Array.from({ length: 50 }, () => engine.generate(key)));
    expect(new Set(results).size).toBe(50);
  });
});
