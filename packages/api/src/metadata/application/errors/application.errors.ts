/** Application-layer errors — never expose PersistenceError or vendor errors */

export const APPLICATION_ERROR_CODE = {
  UNKNOWN: "application_unknown",
  NOT_FOUND: "application_not_found",
  VALIDATION_FAILED: "application_validation_failed",
  BUSINESS_RULE: "application_business_rule",
  CONFLICT: "application_conflict",
  NOT_AUTHORIZED: "application_not_authorized",
} as const;

export type ApplicationErrorCode =
  (typeof APPLICATION_ERROR_CODE)[keyof typeof APPLICATION_ERROR_CODE];

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;

  constructor(code: ApplicationErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ApplicationError";
    this.code = code;
  }
}

export class BusinessRuleViolation extends ApplicationError {
  constructor(message?: string) {
    super(APPLICATION_ERROR_CODE.BUSINESS_RULE, message);
    this.name = "BusinessRuleViolation";
  }
}

export class ValidationFailedError extends ApplicationError {
  constructor(message?: string) {
    super(APPLICATION_ERROR_CODE.VALIDATION_FAILED, message);
    this.name = "ValidationFailedError";
  }
}

export class ApplicationConflictError extends ApplicationError {
  constructor(message?: string) {
    super(APPLICATION_ERROR_CODE.CONFLICT, message);
    this.name = "ApplicationConflictError";
  }
}

export class NotAuthorizedError extends ApplicationError {
  constructor(message?: string) {
    super(APPLICATION_ERROR_CODE.NOT_AUTHORIZED, message);
    this.name = "NotAuthorizedError";
  }
}

export class ApplicationNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(APPLICATION_ERROR_CODE.NOT_FOUND, message);
    this.name = "ApplicationNotFoundError";
  }
}
