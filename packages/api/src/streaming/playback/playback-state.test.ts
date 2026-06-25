import { describe, expect, it } from "vitest";
import { PLAYBACK_BUFFER_TIMEOUT_MS, PLAYBACK_RECONNECT_TIMEOUT_MS } from "@sonafrik/types";
import { derivePlaybackState, resolveQualityKbps } from "./playback-state";

describe("playback-state", () => {
  it("derivePlaybackState — buffer timeout → Error", () => {
    const now = Date.now();
    expect(
      derivePlaybackState(
        "Buffering",
        { bufferingStartedAtMs: now - PLAYBACK_BUFFER_TIMEOUT_MS - 1 },
        now,
      ),
    ).toBe("Error");
  });

  it("derivePlaybackState — reconnect timeout → Error", () => {
    const now = Date.now();
    expect(
      derivePlaybackState(
        "Reconnecting",
        { reconnectingStartedAtMs: now - PLAYBACK_RECONNECT_TIMEOUT_MS - 1 },
        now,
      ),
    ).toBe("Error");
  });

  it("resolveQualityKbps", () => {
    expect(resolveQualityKbps("low")).toBe(64);
    expect(resolveQualityKbps("medium")).toBe(128);
    expect(resolveQualityKbps("high")).toBe(256);
    expect(resolveQualityKbps("auto")).toBeNull();
    expect(resolveQualityKbps("auto", 192)).toBe(192);
  });
});
