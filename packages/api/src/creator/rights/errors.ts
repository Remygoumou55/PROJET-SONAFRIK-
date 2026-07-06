import { RIGHTS_ERROR_MESSAGES } from "@sonafrik/types";

export type RightsErrorCode = keyof typeof RIGHTS_ERROR_MESSAGES;

export class RightsError extends Error {
  constructor(public readonly code: RightsErrorCode) {
    super(RIGHTS_ERROR_MESSAGES[code] ?? RIGHTS_ERROR_MESSAGES.unknown);
    this.name = "RightsError";
  }
}
