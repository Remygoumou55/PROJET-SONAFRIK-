import { NOTIFICATION_ERROR_MESSAGES } from "@sonafrik/types";

export type NotificationErrorCode = keyof typeof NOTIFICATION_ERROR_MESSAGES;

export class NotificationError extends Error {
  constructor(public readonly code: NotificationErrorCode) {
    super(NOTIFICATION_ERROR_MESSAGES[code] ?? NOTIFICATION_ERROR_MESSAGES.unknown);
    this.name = "NotificationError";
  }
}
