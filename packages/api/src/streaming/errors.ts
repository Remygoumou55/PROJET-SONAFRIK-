import { STREAMING_ERROR_MESSAGES } from "@sonafrik/types";

export class StreamingError extends Error {
  readonly code: keyof typeof STREAMING_ERROR_MESSAGES;

  constructor(code: keyof typeof STREAMING_ERROR_MESSAGES) {
    super(STREAMING_ERROR_MESSAGES[code]);
    this.name = "StreamingError";
    this.code = code;
  }
}
