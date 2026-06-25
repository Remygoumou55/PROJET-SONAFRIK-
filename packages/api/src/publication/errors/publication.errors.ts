/** Publication orchestrator errors — never expose ApplicationError or PersistenceError */

export const PUBLICATION_ERROR_CODE = {
  UNKNOWN: "publication_unknown",
  FAILED: "publication_failed",
  VALIDATION_FAILED: "publication_validation_failed",
  METADATA_INCOMPLETE: "publication_metadata_incomplete",
  ISRC_RESERVATION_FAILED: "publication_isrc_reservation_failed",
  WORKFLOW_CONFLICT: "publication_workflow_conflict",
  ROLLBACK_FAILED: "publication_rollback_failed",
  NOT_AUTHORIZED: "publication_not_authorized",
} as const;

export type PublicationErrorCode =
  (typeof PUBLICATION_ERROR_CODE)[keyof typeof PUBLICATION_ERROR_CODE];

export class PublicationError extends Error {
  readonly code: PublicationErrorCode;

  constructor(code: PublicationErrorCode, message?: string) {
    super(message ?? code);
    this.name = "PublicationError";
    this.code = code;
  }
}

export class PublicationFailedError extends PublicationError {
  constructor(message?: string) {
    super(PUBLICATION_ERROR_CODE.FAILED, message);
    this.name = "PublicationFailedError";
  }
}

export class PublicationValidationFailedError extends PublicationError {
  constructor(message?: string) {
    super(PUBLICATION_ERROR_CODE.VALIDATION_FAILED, message);
    this.name = "PublicationValidationFailedError";
  }
}

export class MetadataIncompleteError extends PublicationError {
  constructor(message?: string) {
    super(PUBLICATION_ERROR_CODE.METADATA_INCOMPLETE, message);
    this.name = "MetadataIncompleteError";
  }
}

export class ISRCReservationFailedError extends PublicationError {
  constructor(message?: string) {
    super(PUBLICATION_ERROR_CODE.ISRC_RESERVATION_FAILED, message);
    this.name = "ISRCReservationFailedError";
  }
}

export class WorkflowConflictError extends PublicationError {
  constructor(message?: string) {
    super(PUBLICATION_ERROR_CODE.WORKFLOW_CONFLICT, message);
    this.name = "WorkflowConflictError";
  }
}

export class RollbackFailedError extends PublicationError {
  constructor(message?: string) {
    super(PUBLICATION_ERROR_CODE.ROLLBACK_FAILED, message);
    this.name = "RollbackFailedError";
  }
}

export class PublicationNotAuthorizedError extends PublicationError {
  constructor(message?: string) {
    super(PUBLICATION_ERROR_CODE.NOT_AUTHORIZED, message);
    this.name = "PublicationNotAuthorizedError";
  }
}
