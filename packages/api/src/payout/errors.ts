import { PAYOUT_ENGINE_ERROR_MESSAGES } from "@sonafrik/types";

export type PayoutEngineErrorCode = keyof typeof PAYOUT_ENGINE_ERROR_MESSAGES;

export class PayoutEngineError extends Error {
  constructor(public readonly code: PayoutEngineErrorCode) {
    super(
      PAYOUT_ENGINE_ERROR_MESSAGES[code] ??
        PAYOUT_ENGINE_ERROR_MESSAGES.unknown,
    );
    this.name = "PayoutEngineError";
  }
}
