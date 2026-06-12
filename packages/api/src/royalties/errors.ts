import { ROYALTY_ENGINE_ERROR_MESSAGES } from "@sonafrik/types";

export type RoyaltyEngineErrorCode = keyof typeof ROYALTY_ENGINE_ERROR_MESSAGES;

export class RoyaltyEngineError extends Error {
  constructor(public readonly code: RoyaltyEngineErrorCode) {
    super(
      ROYALTY_ENGINE_ERROR_MESSAGES[code] ??
        ROYALTY_ENGINE_ERROR_MESSAGES.unknown,
    );
    this.name = "RoyaltyEngineError";
  }
}
