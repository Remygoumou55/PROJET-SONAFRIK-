import { TIPS_ERROR_MESSAGES } from "@sonafrik/types";

export type TipsErrorCode = keyof typeof TIPS_ERROR_MESSAGES;

export class TipsError extends Error {
  constructor(public readonly code: TipsErrorCode) {
    super(TIPS_ERROR_MESSAGES[code] ?? TIPS_ERROR_MESSAGES.unknown);
    this.name = "TipsError";
  }
}
