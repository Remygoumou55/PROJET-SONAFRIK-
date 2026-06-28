import { REAL_LISTEN_THRESHOLD_PERCENT } from "@sonafrik/types";
import type { StreamCompletePayload } from "./playerTypes";

export type StreamCompleteMode = "natural" | "manual";

interface BuildStreamCompletePayloadInput {
  sessionId: string;
  positionSeconds: number;
  accumulatedSeconds: number;
  durationSeconds: number;
  mode: StreamCompleteMode;
}

/** Construit le payload stream-complete — position = max(heartbeat, playhead). */
export function buildStreamCompletePayload(
  input: BuildStreamCompletePayloadInput,
): StreamCompletePayload {
  const totalDurationSeconds = Math.max(Math.floor(input.durationSeconds), 1);
  let positionSeconds = Math.max(input.accumulatedSeconds, input.positionSeconds, 0);

  if (input.mode === "natural") {
    positionSeconds = Math.max(
      positionSeconds,
      totalDurationSeconds * (REAL_LISTEN_THRESHOLD_PERCENT / 100),
    );
  }

  return {
    sessionId: input.sessionId,
    positionSeconds: Math.floor(positionSeconds),
    totalDurationSeconds,
  };
}
