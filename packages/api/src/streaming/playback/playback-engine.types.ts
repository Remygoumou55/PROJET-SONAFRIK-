import type { PlaybackStateId } from "@sonafrik/types";
import type { StreamingDomainEventType } from "../events";
import type { PlaybackRuntimeOverlay } from "./playback-state";

export interface PlaybackCommandResult {
  readonly state: PlaybackStateId;
  readonly events: readonly StreamingDomainEventType[];
  readonly sessionId?: string;
  readonly signedUrl?: string;
  readonly signedUrlExpiresAt?: string;
  readonly positionSeconds?: number;
}

export interface PlaybackInstance {
  state: PlaybackStateId;
  overlay: PlaybackRuntimeOverlay;
}
