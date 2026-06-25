import { describe, expect, it } from "vitest";
import {
  createFoundationRuntimePorts,
  createStreamingRuntimeBundle,
  createStreamingRuntimeCoordinator,
  createStreamingRuntimeDependencies,
  createSupabaseRuntimePorts,
} from "./streaming-runtime-factory";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "../integration/feature-flags";

describe("streaming-runtime-factory", () => {
  it("creates foundation ports with stub engines", () => {
    const ports = createFoundationRuntimePorts();
    expect(ports.sessionEngine.engineId).toBe("session-engine");
    expect(ports.legacyAdapter.isActive()).toBe(true);
  });

  it("creates coordinator with default config", () => {
    const coordinator = createStreamingRuntimeCoordinator({
      config: buildRuntimeConfig(DEFAULT_STREAMING_RUNTIME_FLAGS),
    });
    expect(coordinator.resolveExecutionMode()).toBe("legacy");
  });

  it("creates supabase runtime ports", () => {
    const ports = createSupabaseRuntimePorts({} as never);
    expect(ports.sessionEngine.engineId).toBe("session-engine");
    expect(ports.sessionRepository).toBeDefined();
  });

  it("creates runtime bundle and dependencies", () => {
    const config = buildRuntimeConfig(DEFAULT_STREAMING_RUNTIME_FLAGS);
    const bundle = createStreamingRuntimeBundle({ config });
    expect(bundle.coordinator).toBeDefined();
    expect(bundle.legacyPort.mode).toBe("legacy");

    const deps = createStreamingRuntimeDependencies({ config });
    expect(deps.pipeline.list()).toEqual([
      "OpenSession",
      "RecordHeartbeat",
      "CompleteSession",
      "InvalidateSession",
      "DispatchPlaybackCommand",
    ]);
  });

  it("exercises foundation port adapters", async () => {
    const ports = createFoundationRuntimePorts();
    await ports.streamEventRepository.append({
      eventId: "1",
      eventType: "PlaybackRequested",
      eventVersion: "1.0.0",
      correlationId: "c",
      actorId: "a",
      occurredAt: new Date().toISOString(),
      payload: {},
    });
    expect(await ports.sessionRepository.findById("s", "u")).toBeNull();
    expect(
      ports.playbackEngine.isReady(
        buildRuntimeConfig({
          ...DEFAULT_STREAMING_RUNTIME_FLAGS,
          runtimeEnabled: true,
          applicationLayerEnabled: true,
          portsEnabled: true,
          playbackEngineEnabled: true,
        }),
      ),
    ).toBe(true);
    expect(
      ports.playbackEngine.isReady(
        buildRuntimeConfig({
          ...DEFAULT_STREAMING_RUNTIME_FLAGS,
          runtimeEnabled: true,
          portsEnabled: true,
        }),
      ),
    ).toBe(false);
  });
});
