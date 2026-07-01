import type { MutableRefObject, RefObject } from "react";
import type { StreamCompletePayload } from "./playerTypes";
import { buildStreamCompletePayload, type StreamCompleteMode } from "@sonafrik/shared/streaming";
import { STREAM_HEARTBEAT_INTERVAL_MS } from "@sonafrik/types";

export function clearAudioElement(audio: HTMLAudioElement): void {
  audio.pause();
  audio.onerror = null;
  audio.oncanplay = null;
  audio.onloadedmetadata = null;
  audio.ontimeupdate = null;
  audio.onended = null;
  audio.removeAttribute("src");
  audio.load();
}

export function createStreamHeartbeat(
  audioRef: RefObject<HTMLAudioElement | null>,
  accumulatedRef: MutableRefObject<number>,
  onTick: MutableRefObject<((pos: number) => void) | null>,
): {
  start: () => void;
  clear: () => void;
} {
  let interval: ReturnType<typeof setInterval> | null = null;

  const clear = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  const start = () => {
    clear();
    interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        accumulatedRef.current += STREAM_HEARTBEAT_INTERVAL_MS / 1000;
        onTick.current?.(accumulatedRef.current);
      }
    }, STREAM_HEARTBEAT_INTERVAL_MS);
  };

  return { start, clear };
}

export function resolveTrackDurationSeconds(
  audio: HTMLAudioElement | null,
  activeDurationRef: MutableRefObject<number>,
): number {
  const fromAudio =
    audio && audio.duration > 0 && isFinite(audio.duration) ? audio.duration : 0;
  return Math.max(fromAudio, activeDurationRef.current, 1);
}

export function buildCompletePayload(
  sessionId: string | null,
  positionSeconds: number,
  accumulatedSeconds: number,
  durationSeconds: number,
  mode: StreamCompleteMode = "manual",
): StreamCompletePayload | null {
  if (!sessionId) return null;
  return buildStreamCompletePayload({
    sessionId,
    positionSeconds,
    accumulatedSeconds,
    durationSeconds,
    mode,
  });
}
