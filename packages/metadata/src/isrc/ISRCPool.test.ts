import { describe, expect, it } from "vitest";
import { ISRCRegistryImpl } from "./ISRCRegistry";
import { ISRCPoolImpl } from "./ISRCPool";
import { brandISRC } from "./utils/branding";

describe("ISRCPool", () => {
  it("adds and takes ISRCs", async () => {
    const pool = new ISRCPoolImpl();
    const isrc = brandISRC("GNSFK2400010");
    await pool.add(isrc);
    expect(pool.size()).toBe(1);
    expect(await pool.take()).toBe(isrc);
    expect(pool.size()).toBe(0);
  });

  it("deduplicates on add", async () => {
    const pool = new ISRCPoolImpl();
    const isrc = brandISRC("GNSFK2400011");
    await pool.add(isrc);
    await pool.add(isrc);
    expect(pool.size()).toBe(1);
  });

  it("syncs with registry when provided", async () => {
    const registry = new ISRCRegistryImpl();
    const pool = new ISRCPoolImpl(registry);
    const isrc = brandISRC("GNSFK2400012");
    await pool.add(isrc);
    expect(await registry.exists(isrc)).toBe(true);
  });
});
