import { describe, expect, it, vi } from "vitest";
import type { StreamStartResult } from "@sonafrik/types";
import { createStreamingApplicationService } from "../application/services/streaming-application.service";
import { createStreamingRuntimeCoordinator } from "../runtime";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "./feature-flags";
import {
  StreamingPlaybackBridge,
  createStreamingPlaybackBridge,
} from "./streaming-playback-bridge";
import type { StreamingService } from "../streaming.service";
import type { SonafrikSupabaseClient } from "@sonafrik/database";

const mockClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-bridge-1" } } }),
  },
} as unknown as SonafrikSupabaseClient;

function buildFoundation(flags = DEFAULT_STREAMING_RUNTIME_FLAGS) {
  const config = buildRuntimeConfig(flags);
  const coordinator = createStreamingRuntimeCoordinator({ config });
  const application = createStreamingApplicationService({ coordinator, config });
  return { config, coordinator, application };
}

function mockLegacy(overrides: Partial<StreamingService> = {}): StreamingService {
  return {
    startStream: vi.fn().mockResolvedValue({
      sessionId: "sess-legacy-1",
      signedUrl: "https://example.com/audio.mp3",
      durationSeconds: 180,
    } satisfies StreamStartResult),
    sendHeartbeat: vi.fn().mockResolvedValue(undefined),
    completeStream: vi.fn().mockResolvedValue(undefined),
    savePosition: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as StreamingService;
}

describe("StreamingPlaybackBridge", () => {
  it("defaults to legacy mode when runtime flags are off", async () => {
    const events: unknown[] = [];
    const legacy = mockLegacy();
    const bridge = new StreamingPlaybackBridge(
      mockClient,
      { onObserve: (e) => events.push(e) },
      {
        legacy,
        loadFoundation: async () => buildFoundation(),
      },
    );

    await bridge.initialize();
    expect(bridge.getPlaybackMode()).toBe("legacy");

    const status = await bridge.refreshRuntimeStatus();
    expect(status.mode).toBe("legacy");
    expect(status.runtimeEnabled).toBe(false);
    expect(events.some((e) => (e as { type: string }).type === "initialized")).toBe(true);
  });

  it("delegates startStream to legacy while observing runtime status", async () => {
    const legacy = mockLegacy();
    const bridge = new StreamingPlaybackBridge(
      mockClient,
      {},
      {
        legacy,
        loadFoundation: async () =>
          buildFoundation({
            ...DEFAULT_STREAMING_RUNTIME_FLAGS,
            runtimeEnabled: true,
            applicationLayerEnabled: true,
            contractsEnabled: true,
            contextEnabled: true,
            portsEnabled: true,
          }),
      },
    );

    const result = await bridge.startStream({
      trackId: "00000000-0000-4000-8000-000000000001",
      platform: "web",
    });

    expect(legacy.startStream).toHaveBeenCalledOnce();
    expect(result.sessionId).toBe("sess-legacy-1");
    expect(bridge.getPlaybackMode()).toBe("runtime");
  });

  it("delegates heartbeat and complete to legacy", async () => {
    const legacy = mockLegacy();
    const bridge = new StreamingPlaybackBridge(mockClient, {}, { legacy, loadFoundation: async () => buildFoundation() });

    await bridge.sendHeartbeat({
      sessionId: "00000000-0000-4000-8000-000000000002",
      positionSeconds: 42,
    });
    await bridge.completeStream({
      sessionId: "00000000-0000-4000-8000-000000000002",
      positionSeconds: 180,
      totalDurationSeconds: 180,
    });

    expect(legacy.sendHeartbeat).toHaveBeenCalledOnce();
    expect(legacy.completeStream).toHaveBeenCalledOnce();
  });

  it("factory creates bridge instance", () => {
    const bridge = createStreamingPlaybackBridge(mockClient, {}, {
      legacy: mockLegacy(),
      loadFoundation: async () => buildFoundation(),
    });
    expect(bridge).toBeInstanceOf(StreamingPlaybackBridge);
  });
});
