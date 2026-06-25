import { describe, expect, it, beforeEach } from "vitest";
import { ISRC_AUDIT_ACTION } from "@sonafrik/types";
import { ISRCAuditServiceImpl, resetAuditCounter } from "./ISRCAuditService";
import { brandISRC } from "./utils/branding";

describe("ISRCAuditService", () => {
  beforeEach(() => resetAuditCounter());

  it("records and queries audit entries", async () => {
    const audit = new ISRCAuditServiceImpl();
    const isrc = brandISRC("GNSFK2400001");
    await audit.record(ISRC_AUDIT_ACTION.GENERATED, isrc, "actor", "corr", { test: true });
    expect(audit.findByIsrc(isrc)).toHaveLength(1);
    expect(audit.findAll()).toHaveLength(1);
    expect(audit.findByIsrc(isrc)[0]?.payload.test).toBe(true);
  });
});
