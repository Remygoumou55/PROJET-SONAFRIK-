import { PAYMENT_ERROR_MESSAGES } from "@sonafrik/types";

export type PaymentErrorCode = keyof typeof PAYMENT_ERROR_MESSAGES;

export class PaymentError extends Error {
  constructor(public readonly code: PaymentErrorCode, message?: string) {
    super(message ?? PAYMENT_ERROR_MESSAGES[code] ?? PAYMENT_ERROR_MESSAGES.unknown);
    this.name = "PaymentError";
  }
}
