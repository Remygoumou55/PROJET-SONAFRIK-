import { IDENTITY_ERROR_MESSAGES } from "@sonafrik/types";

export class IdentityError extends Error {
  readonly code: keyof typeof IDENTITY_ERROR_MESSAGES;

  constructor(code: keyof typeof IDENTITY_ERROR_MESSAGES) {
    super(IDENTITY_ERROR_MESSAGES[code]);
    this.name = "IdentityError";
    this.code = code;
  }
}
