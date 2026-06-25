/**
 * Sprint 2.1-C — Certification gates (legacy isolation + flag defaults).
 * Preuve que la foundation n'altère pas le chemin prod.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_STREAMING_RUNTIME_FLAGS,
  STREAMING_RUNTIME_FEATURE_FLAGS,
  buildRuntimeConfig,
} from "./integration/feature-flags";
import {
  StreamingService,
  createStreamingService,
  createStreamingRuntimeCoordinator,
} from "./index";

describe("SPRING 2.1-C — Runtime Foundation certification", () => {
  it("expose les 6 flags foundation avec defaults OFF", () => {
    const foundationKeys = [
      "RUNTIME_ENABLED",
      "APPLICATION_LAYER",
      "CONTRACTS",
      "PORTS",
      "EVENTS",
      "CONTEXT",
    ] as const;
    expect(foundationKeys.every((k) => STREAMING_RUNTIME_FEATURE_FLAGS[k])).toBe(true);
    expect(Object.keys(STREAMING_RUNTIME_FEATURE_FLAGS)).toHaveLength(15);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.runtimeEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.applicationLayerEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.contractsEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.portsEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.eventsEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.contextEnabled).toBe(false);
  });

  it("Runtime OFF → mode legacy (identique prod)", () => {
    const coordinator = createStreamingRuntimeCoordinator({
      config: buildRuntimeConfig(DEFAULT_STREAMING_RUNTIME_FLAGS),
    });
    expect(coordinator.resolveExecutionMode()).toBe("legacy");
  });

  it("DRY RUN — runtime ON sans handlers → dry_run, legacy actif", () => {
    const config = {
      ...buildRuntimeConfig({
        ...DEFAULT_STREAMING_RUNTIME_FLAGS,
        runtimeEnabled: true,
        applicationLayerEnabled: true,
      }),
      dryRun: true,
    };
    const coordinator = createStreamingRuntimeCoordinator({ config });
    expect(coordinator.resolveExecutionMode()).toBe("dry_run");
  });

  it("PARTIAL — runtime + ports ON, pipeline vide → pas de side-effect", () => {
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
      contractsEnabled: true,
    });
    const coordinator = createStreamingRuntimeCoordinator({
      config,
      registerSessionHandlers: false,
      registerPlaybackHandlers: false,
    });
    expect(coordinator.getRegisteredHandlers()).toEqual([]);
    expect(coordinator.resolveExecutionMode()).toBe("runtime");
  });

  it("préserve les exports legacy StreamingService", () => {
    expect(typeof StreamingService).toBe("function");
    expect(typeof createStreamingService).toBe("function");
    expect(StreamingService.prototype.startStream).toBeDefined();
    expect(StreamingService.prototype.sendHeartbeat).toBeDefined();
    expect(StreamingService.prototype.completeStream).toBeDefined();
  });
});
