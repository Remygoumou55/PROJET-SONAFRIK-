import { ANALYTICS_ERROR_MESSAGES } from "@sonafrik/types";

export type AnalyticsErrorCode = keyof typeof ANALYTICS_ERROR_MESSAGES;

export class AnalyticsError extends Error {
  constructor(public readonly code: AnalyticsErrorCode) {
    super(ANALYTICS_ERROR_MESSAGES[code] ?? ANALYTICS_ERROR_MESSAGES.unknown);
    this.name = "AnalyticsError";
  }
}
