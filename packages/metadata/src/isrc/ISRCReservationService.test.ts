import { describe, expect, it } from "vitest";
import { ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import { ISRCAuditServiceImpl } from "./ISRCAuditService";
import { ISRCRegistryImpl } from "./ISRCRegistry";
import { ISRCReservationServiceImpl } from "./ISRCReservationService";
import { brandISRC } from "./utils/branding";

describe("ISRCReservationService", () => {
  const isrc = brandISRC("GNSFK2400001");

  it("reserves, releases, and commits", async () => {
    const registry = new ISRCRegistryImpl();
    const audit = new ISRCAuditServiceImpl();
    const reservation = new ISRCReservationServiceImpl(registry, audit);

    await registry.register(isrc, { status: ISRC_REGISTRY_STATUS.AVAILABLE });

    const reserved = await reservation.reserve(isrc, "actor-1", "corr-1");
    expect(reserved.status).toBe(ISRC_REGISTRY_STATUS.RESERVED);

    await expect(reservation.reserve(isrc, "actor-2", "corr-2")).rejects.toThrow();

    const released = await reservation.release(isrc, "actor-1", "corr-1");
    expect(released.status).toBe(ISRC_REGISTRY_STATUS.AVAILABLE);

    await reservation.reserve(isrc, "actor-1", "corr-3");
    const committed = await reservation.commit(isrc, "actor-1", "corr-3");
    expect(committed.status).toBe(ISRC_REGISTRY_STATUS.ACTIVE);
  });

  it("rejects commit on archived ISRC", async () => {
    const registry = new ISRCRegistryImpl();
    const audit = new ISRCAuditServiceImpl();
    const reservation = new ISRCReservationServiceImpl(registry, audit);

    await registry.register(isrc, { status: ISRC_REGISTRY_STATUS.ARCHIVED });
    await expect(reservation.commit(isrc, "actor", "corr")).rejects.toThrow();
  });
});
