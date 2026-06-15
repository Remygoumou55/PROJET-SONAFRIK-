import { ADMIN_ERROR_MESSAGES } from "@sonafrik/types";

export type AdminErrorCode = keyof typeof ADMIN_ERROR_MESSAGES;

export class AdminError extends Error {
  constructor(public readonly code: AdminErrorCode) {
    super(ADMIN_ERROR_MESSAGES[code] ?? ADMIN_ERROR_MESSAGES.unknown);
    this.name = "AdminError";
  }
}
