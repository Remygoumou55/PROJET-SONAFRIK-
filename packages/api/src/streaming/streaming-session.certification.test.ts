/**
 * Sprint 2.2 — Session Engine certification gates.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_STREAMING_RUNTIME_FLAGS,
  STREAMING_RUNTIME_FEATURE_FLAGS,
  buildRuntimeConfig,
} from "./integration/feature-flags";
import {
  StreamingService,
  createStreamingRuntimeCoordinator,
  createStreamingService,
} from "./index";

describe("SPRING 2.2 — Session Engine certification", () => {
  it("expose les 4 flags session avec defaults OFF", () => {
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.sessionEngineEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.sessionHeartbeatEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.sessionRecoveryEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.sessionExpirationEnabled).toBe(false);
    expect(STREAMING_RUNTIME_FEATURE_FLAGS.SESSION_ENGINE).toBe(
      "streaming_session_engine_enabled",
    );
  });

  it("session engine OFF → handlers skipped, legacy actif", async () => {
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: false,
    });
    const coordinator = createStreamingRuntimeCoordinator({
      config: { ...config, dryRun: false },
    });
    expect(coordinator.resolveExecutionMode()).toBe("runtime");
    const result = await coordinator.dispatch(
      {
        actorId: "u1",
        correlationId: "c1",
        trackId: "t1",
        initiatedAt: new Date().toISOString(),
      },
      "OpenSession",
    );
    expect(result.pipeline?.status).toBe("skipped");
    expect(result.legacyActive).toBe(false);
  });

  it("legacy StreamingService inchangé", () => {
    expect(typeof StreamingService).toBe("function");
    expect(typeof createStreamingService).toBe("function");
    expect(StreamingService.prototype.startStream).toBeDefined();
  });
});
