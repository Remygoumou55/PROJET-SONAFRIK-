import { CREATOR_ERROR_MESSAGES } from "@sonafrik/types";

export class CreatorError extends Error {
  readonly code: keyof typeof CREATOR_ERROR_MESSAGES;

  constructor(code: keyof typeof CREATOR_ERROR_MESSAGES, devDetail?: string) {
    const base = CREATOR_ERROR_MESSAGES[code];
    super(
      process.env.NODE_ENV === "development" && devDetail
        ? `${base} [dev: ${devDetail}]`
        : base,
    );
    this.name = "CreatorError";
    this.code = code;
  }
}
