import type { PlaybackStateId, PlaybackTransitionTrigger } from "@sonafrik/types";

export interface PlaybackTransitionResult {
  readonly allowed: boolean;
  readonly nextState: PlaybackStateId | null;
}

/** Authorized transitions — STATE_MACHINE.md §5.1 */
const TRANSITIONS: Readonly<
  Record<PlaybackStateId, Partial<Record<PlaybackTransitionTrigger, PlaybackStateId>>>
> = {
  Idle: { PlayRequested: "Preparing" },
  Preparing: {
    PreparingSucceeded: "Loading",
    PreparingFailed: "Error",
    CancelRequested: "Cancelled",
  },
  Loading: {
    StartStreamSucceeded: "Buffering",
    StartStreamFailed: "Error",
    CancelRequested: "Cancelled",
  },
  Buffering: {
    BufferFilledReady: "Ready",
    BufferFilledPlaying: "Playing",
    BufferTimeout: "Error",
    CancelRequested: "Cancelled",
  },
  Ready: {
    PlaybackStarted: "Playing",
    CancelRequested: "Cancelled",
  },
  Playing: {
    PauseRequested: "Paused",
    SeekRequested: "Seeking",
    BufferEmpty: "Buffering",
    ConnectionLost: "Reconnecting",
    TrackEnded: "Completed",
    AudioError: "Error",
    StopRequested: "Cancelled",
  },
  Paused: {
    ResumeRequested: "Playing",
    StopRequested: "Cancelled",
    SessionExpired: "Error",
  },
  Seeking: {
    SeekCompleted: "Playing",
    SeekTimeout: "Playing",
    SeekFailed: "Error",
  },
  Reconnecting: {
    ConnectionRecoveredPlaying: "Playing",
    ConnectionRecoveredPaused: "Paused",
    ReconnectTimeout: "Error",
    SessionExpired: "Error",
  },
  Completed: { PlayRequested: "Preparing" },
  Cancelled: { ReconcileToIdle: "Idle" },
  Error: {
    RetryRequested: "Preparing",
    DismissError: "Idle",
    PlayRequested: "Preparing",
  },
};

export function transitionPlaybackState(
  current: PlaybackStateId,
  trigger: PlaybackTransitionTrigger,
): PlaybackTransitionResult {
  if (trigger === "FraudDetected") {
    return { allowed: true, nextState: "Error" };
  }

  const next = TRANSITIONS[current]?.[trigger] ?? null;
  if (!next) {
    return { allowed: false, nextState: null };
  }

  return { allowed: true, nextState: next };
}

export function allPlaybackTransitionTriggers(): PlaybackTransitionTrigger[] {
  return [
    "PlayRequested",
    "PreparingSucceeded",
    "PreparingFailed",
    "CancelRequested",
    "StartStreamSucceeded",
    "StartStreamFailed",
    "BufferFilledReady",
    "BufferFilledPlaying",
    "BufferTimeout",
    "PlaybackStarted",
    "PauseRequested",
    "ResumeRequested",
    "SeekRequested",
    "BufferEmpty",
    "ConnectionLost",
    "TrackEnded",
    "AudioError",
    "StopRequested",
    "SessionExpired",
    "SeekCompleted",
    "SeekTimeout",
    "SeekFailed",
    "ConnectionRecoveredPlaying",
    "ConnectionRecoveredPaused",
    "ReconnectTimeout",
    "RetryRequested",
    "DismissError",
    "FraudDetected",
    "ReconcileToIdle",
  ];
}

export function canStartPlaybackFrom(current: PlaybackStateId): boolean {
  return current === "Idle" || current === "Completed" || current === "Cancelled" || current === "Error";
}
