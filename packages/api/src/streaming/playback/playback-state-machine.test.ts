import { describe, expect, it } from "vitest";
import type { PlaybackStateId, PlaybackTransitionTrigger } from "@sonafrik/types";
import {
  allPlaybackTransitionTriggers,
  canStartPlaybackFrom,
  transitionPlaybackState,
} from "./playback-state-machine";

const AUTHORIZED: Array<[PlaybackStateId, PlaybackTransitionTrigger, PlaybackStateId]> = [
  ["Idle", "PlayRequested", "Preparing"],
  ["Preparing", "PreparingSucceeded", "Loading"],
  ["Preparing", "PreparingFailed", "Error"],
  ["Preparing", "CancelRequested", "Cancelled"],
  ["Loading", "StartStreamSucceeded", "Buffering"],
  ["Loading", "StartStreamFailed", "Error"],
  ["Loading", "CancelRequested", "Cancelled"],
  ["Buffering", "BufferFilledReady", "Ready"],
  ["Buffering", "BufferFilledPlaying", "Playing"],
  ["Buffering", "BufferTimeout", "Error"],
  ["Buffering", "CancelRequested", "Cancelled"],
  ["Ready", "PlaybackStarted", "Playing"],
  ["Ready", "CancelRequested", "Cancelled"],
  ["Playing", "PauseRequested", "Paused"],
  ["Playing", "SeekRequested", "Seeking"],
  ["Playing", "BufferEmpty", "Buffering"],
  ["Playing", "ConnectionLost", "Reconnecting"],
  ["Playing", "TrackEnded", "Completed"],
  ["Playing", "AudioError", "Error"],
  ["Playing", "StopRequested", "Cancelled"],
  ["Paused", "ResumeRequested", "Playing"],
  ["Paused", "StopRequested", "Cancelled"],
  ["Paused", "SessionExpired", "Error"],
  ["Seeking", "SeekCompleted", "Playing"],
  ["Seeking", "SeekTimeout", "Playing"],
  ["Seeking", "SeekFailed", "Error"],
  ["Reconnecting", "ConnectionRecoveredPlaying", "Playing"],
  ["Reconnecting", "ConnectionRecoveredPaused", "Paused"],
  ["Reconnecting", "ReconnectTimeout", "Error"],
  ["Reconnecting", "SessionExpired", "Error"],
  ["Completed", "PlayRequested", "Preparing"],
  ["Cancelled", "ReconcileToIdle", "Idle"],
  ["Error", "RetryRequested", "Preparing"],
  ["Error", "DismissError", "Idle"],
  ["Error", "PlayRequested", "Preparing"],
];

describe("playback-state-machine", () => {
  it.each(AUTHORIZED)("autorise %s + %s → %s", (from, trigger, expected) => {
    const result = transitionPlaybackState(from, trigger);
    expect(result.allowed).toBe(true);
    expect(result.nextState).toBe(expected);
  });

  it("FraudDetected force Error depuis tout état", () => {
    expect(transitionPlaybackState("Playing", "FraudDetected").nextState).toBe("Error");
  });

  it("canStartPlaybackFrom", () => {
    expect(canStartPlaybackFrom("Idle")).toBe(true);
    expect(canStartPlaybackFrom("Playing")).toBe(false);
  });

  it("expose les triggers documentés", () => {
    expect(allPlaybackTransitionTriggers().length).toBeGreaterThanOrEqual(28);
  });

  it("refuse une transition non documentée", () => {
    const result = transitionPlaybackState("Playing", "PreparingSucceeded");
    expect(result.allowed).toBe(false);
    expect(result.nextState).toBeNull();
  });
});
