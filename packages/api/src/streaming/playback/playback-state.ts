import type { PlaybackStateId } from "@sonafrik/types";
import { PLAYBACK_BUFFER_TIMEOUT_MS, PLAYBACK_RECONNECT_TIMEOUT_MS } from "@sonafrik/types";

export interface PlaybackRuntimeOverlay {
  readonly trackId?: string;
  readonly sessionId?: string;
  readonly signedUrl?: string;
  readonly signedUrlExpiresAt?: string;
  readonly positionSeconds?: number;
  readonly autoPlay?: boolean;
  readonly qualityLevel?: string;
  readonly bufferingStartedAtMs?: number;
  readonly reconnectingStartedAtMs?: number;
  readonly wasPlayingBeforeReconnect?: boolean;
}

export function derivePlaybackState(
  base: PlaybackStateId,
  overlay: PlaybackRuntimeOverlay = {},
  nowMs: number = Date.now(),
): PlaybackStateId {
  if (base === "Buffering" && overlay.bufferingStartedAtMs) {
    if (nowMs - overlay.bufferingStartedAtMs > PLAYBACK_BUFFER_TIMEOUT_MS) {
      return "Error";
    }
  }

  if (base === "Reconnecting" && overlay.reconnectingStartedAtMs) {
    if (nowMs - overlay.reconnectingStartedAtMs > PLAYBACK_RECONNECT_TIMEOUT_MS) {
      return "Error";
    }
  }

  return base;
}

export function resolveQualityKbps(
  level: "auto" | "low" | "medium" | "high",
  explicitKbps?: number | null,
): number | null {
  if (explicitKbps != null) return explicitKbps;
  switch (level) {
    case "low":
      return 64;
    case "medium":
      return 128;
    case "high":
      return 256;
    default:
      return null;
  }
}
