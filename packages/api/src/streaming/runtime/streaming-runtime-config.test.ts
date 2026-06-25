import { describe, expect, it } from "vitest";
import {
  canPublishEvents,
  canUsePorts,
  isApplicationLayerActive,
  isPlaybackBufferActive,
  isPlaybackEngineActive,
  isPlaybackQualityActive,
  isPlaybackRecoveryActive,
  isPlaybackSignedUrlActive,
  isRuntimeActive,
  isSessionEngineActive,
  isSessionExpirationActive,
  isSessionHeartbeatActive,
  isSessionRecoveryActive,
  requiresLegacyPath,
} from "./streaming-runtime-config";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "../integration/feature-flags";

describe("streaming-runtime-config", () => {
  const disabled = buildRuntimeConfig(DEFAULT_STREAMING_RUNTIME_FLAGS);
  const enabled = buildRuntimeConfig({
    ...DEFAULT_STREAMING_RUNTIME_FLAGS,
    runtimeEnabled: true,
    applicationLayerEnabled: true,
    portsEnabled: true,
    eventsEnabled: true,
    sessionEngineEnabled: true,
    sessionHeartbeatEnabled: true,
    sessionRecoveryEnabled: true,
    sessionExpirationEnabled: true,
    playbackEngineEnabled: true,
    playbackSignedUrlEnabled: true,
    playbackBufferEnabled: true,
    playbackRecoveryEnabled: true,
    playbackQualityEnabled: true,
  });

  it("detects inactive runtime", () => {
    expect(isRuntimeActive(disabled)).toBe(false);
    expect(requiresLegacyPath(disabled)).toBe(true);
  });

  it("detects active runtime layers", () => {
    expect(isRuntimeActive(enabled)).toBe(true);
    expect(isApplicationLayerActive(enabled)).toBe(true);
    expect(canUsePorts(enabled)).toBe(true);
    expect(canPublishEvents(enabled)).toBe(true);
    expect(requiresLegacyPath(enabled)).toBe(false);
  });

  it("session et playback gates", () => {
    expect(isSessionEngineActive(enabled)).toBe(true);
    expect(isSessionHeartbeatActive(enabled)).toBe(true);
    expect(isSessionRecoveryActive(enabled)).toBe(true);
    expect(isSessionExpirationActive(enabled)).toBe(true);
    expect(isPlaybackEngineActive(enabled)).toBe(true);
    expect(isPlaybackSignedUrlActive(enabled)).toBe(true);
    expect(isPlaybackBufferActive(enabled)).toBe(true);
    expect(isPlaybackRecoveryActive(enabled)).toBe(true);
    expect(isPlaybackQualityActive(enabled)).toBe(true);

    expect(isSessionHeartbeatActive(buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: false,
    }))).toBe(false);

    expect(isPlaybackSignedUrlActive(buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      playbackEngineEnabled: true,
      playbackSignedUrlEnabled: false,
    }))).toBe(false);
  });
});
