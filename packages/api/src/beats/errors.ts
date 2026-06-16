import { BEATS_ERROR_MESSAGES } from "@sonafrik/types";

export type BeatsErrorCode = keyof typeof BEATS_ERROR_MESSAGES;

export class BeatsError extends Error {
  constructor(public readonly code: BeatsErrorCode) {
    super(BEATS_ERROR_MESSAGES[code] ?? BEATS_ERROR_MESSAGES.unknown);
    this.name = "BeatsError";
  }
}
