import { describe, expect, it } from "vitest";
import { createPersistenceTelemetry } from "../observability/persistence-telemetry";

describe("PersistenceTelemetry", () => {
  it("records health diagnostics", () => {
    const telemetry = createPersistenceTelemetry();
    telemetry.recordHealth({
      healthy: true,
      provider: "supabase",
      latencyMs: 12,
      message: null,
    });
    const diag = telemetry.getDiagnostics();
    expect(diag?.healthy).toBe(true);
    expect(diag?.provider).toBe("supabase");
    expect(diag?.latencyMs).toBe(12);
  });

  it("records metrics without throwing", () => {
    const telemetry = createPersistenceTelemetry();
    expect(() =>
      telemetry.recordMetric({
        name: "persistence.query.latency",
        value: 5,
        unit: "ms",
        recordedAt: new Date().toISOString(),
      }),
    ).not.toThrow();
  });
});
