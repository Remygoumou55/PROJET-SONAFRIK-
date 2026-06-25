import { describe, expect, it } from "vitest";
import { ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import { ISRCRegistryImpl } from "./ISRCRegistry";
import { brandISRC } from "./utils/branding";

describe("ISRCRegistry", () => {
  it("registers and looks up ISRC", async () => {
    const registry = new ISRCRegistryImpl();
    const isrc = brandISRC("GNSFK2400001");
    await registry.register(isrc);
    const entry = await registry.lookup(isrc);
    expect(entry?.status).toBe(ISRC_REGISTRY_STATUS.ACTIVE);
  });

  it("prevents duplicate registration", async () => {
    const registry = new ISRCRegistryImpl();
    const isrc = brandISRC("GNSFK2400001");
    await registry.register(isrc);
    await expect(registry.register(isrc)).rejects.toThrow();
  });

  it("finds by status", async () => {
    const registry = new ISRCRegistryImpl();
    const isrc = brandISRC("GNSFK2400002");
    await registry.register(isrc, { status: ISRC_REGISTRY_STATUS.AVAILABLE });
    const available = await registry.findByStatus(ISRC_REGISTRY_STATUS.AVAILABLE);
    expect(available.some((e) => e.isrc === isrc)).toBe(true);
  });

  it("updates status", async () => {
    const registry = new ISRCRegistryImpl();
    const isrc = brandISRC("GNSFK2400003");
    await registry.register(isrc);
    const updated = await registry.updateStatus(isrc, ISRC_REGISTRY_STATUS.ARCHIVED);
    expect(updated.status).toBe(ISRC_REGISTRY_STATUS.ARCHIVED);
  });
});
