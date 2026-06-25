/**
 * Sprint 2.3 — Playback Runtime certification gates.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_STREAMING_RUNTIME_FLAGS,
  STREAMING_RUNTIME_FEATURE_FLAGS,
  buildRuntimeConfig,
} from "../integration/feature-flags";
import { createStreamingRuntimeCoordinator, createFoundationRuntimePorts } from "../runtime";
import { StreamingService } from "../streaming.service";

describe("SPRING 2.3 — Playback Runtime certification", () => {
  it("expose les 5 flags playback avec defaults OFF", () => {
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.playbackEngineEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.playbackBufferEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.playbackRecoveryEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.playbackQualityEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.playbackSignedUrlEnabled).toBe(false);
    expect(STREAMING_RUNTIME_FEATURE_FLAGS.PLAYBACK_ENGINE).toBe(
      "streaming_playback_engine_enabled",
    );
  });

  it("playback OFF → DispatchPlaybackCommand skipped", async () => {
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
      playbackEngineEnabled: false,
    });
    const coordinator = createStreamingRuntimeCoordinator({
      config: { ...config, dryRun: false },
      ports: createFoundationRuntimePorts(),
    });
    const result = await coordinator.dispatch(
      {
        actorId: "u1",
        correlationId: "c1",
        initiatedAt: new Date().toISOString(),
        payload: { playbackCommand: { type: "PreparePlayback", trackId: "t1" } },
      },
      "DispatchPlaybackCommand",
    );
    expect(result.pipeline?.status).toBe("skipped");
  });

  it("legacy StreamingService inchangé", () => {
    expect(StreamingService.prototype.startStream).toBeDefined();
    expect(StreamingService.prototype.sendHeartbeat).toBeDefined();
  });
});
