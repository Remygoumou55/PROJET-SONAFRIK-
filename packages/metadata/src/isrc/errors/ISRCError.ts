import type { ISRCErrorCode } from "@sonafrik/types";
import { ISRC_ERROR_MESSAGES } from "@sonafrik/types";

export class ISRCError extends Error {
  readonly code: ISRCErrorCode;

  constructor(code: ISRCErrorCode, message?: string) {
    super(message ?? ISRC_ERROR_MESSAGES[code]);
    this.name = "ISRCError";
    this.code = code;
  }
}

export class ISRCParseError extends ISRCError {
  constructor(message?: string) {
    super("isrc_parse_failed", message);
    this.name = "ISRCParseError";
  }
}

export class ISRCValidationError extends ISRCError {
  constructor(message?: string) {
    super("isrc_validation_failed", message);
    this.name = "ISRCValidationError";
  }
}

export class ISRCGenerationError extends ISRCError {
  constructor(message?: string) {
    super("isrc_generation_failed", message);
    this.name = "ISRCGenerationError";
  }
}

export class ISRCReservationError extends ISRCError {
  constructor(message?: string) {
    super("isrc_reservation_conflict", message);
    this.name = "ISRCReservationError";
  }
}
