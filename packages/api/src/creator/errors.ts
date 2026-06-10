import { CREATOR_ERROR_MESSAGES } from "@sonafrik/types";

export class CreatorError extends Error {
  readonly code: keyof typeof CREATOR_ERROR_MESSAGES;

  constructor(code: keyof typeof CREATOR_ERROR_MESSAGES) {
    super(CREATOR_ERROR_MESSAGES[code]);
    this.name = "CreatorError";
    this.code = code;
  }
}
