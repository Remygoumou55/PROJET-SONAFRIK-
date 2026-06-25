import { describe, expect, it } from "vitest";
import {
  DEFAULT_STREAMING_RUNTIME_FLAGS,
  buildRuntimeConfig,
  STREAMING_RUNTIME_FEATURE_FLAGS,
} from "./feature-flags";

describe("StreamingRuntimeFeatureFlags", () => {
  it("exposes fifteen streaming runtime flags", () => {
    expect(Object.keys(STREAMING_RUNTIME_FEATURE_FLAGS)).toHaveLength(15);
    expect(STREAMING_RUNTIME_FEATURE_FLAGS.RUNTIME_ENABLED).toBe("streaming_runtime_enabled");
    expect(STREAMING_RUNTIME_FEATURE_FLAGS.SESSION_ENGINE).toBe(
      "streaming_session_engine_enabled",
    );
  });

  it("defaults all flags to false", () => {
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.runtimeEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.applicationLayerEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.contractsEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.portsEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.eventsEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.contextEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.sessionEngineEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.sessionHeartbeatEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.sessionRecoveryEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.sessionExpirationEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.playbackEngineEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.playbackBufferEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.playbackRecoveryEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.playbackQualityEnabled).toBe(false);
    expect(DEFAULT_STREAMING_RUNTIME_FLAGS.playbackSignedUrlEnabled).toBe(false);
  });

  it("buildRuntimeConfig sets dryRun when runtime disabled", () => {
    const config = buildRuntimeConfig(DEFAULT_STREAMING_RUNTIME_FLAGS);
    expect(config.dryRun).toBe(true);
    expect(config.runtimeEnabled).toBe(false);
  });

  it("buildRuntimeConfig clears dryRun when runtime enabled", () => {
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
    });
    expect(config.dryRun).toBe(false);
    expect(config.runtimeEnabled).toBe(true);
  });
});
