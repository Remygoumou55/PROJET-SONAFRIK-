import {
  ApplicationConflictError,
  ApplicationError,
  ApplicationNotFoundError,
  NotAuthorizedError,
  ValidationFailedError,
} from "../../metadata/application/errors";
import {
  ISRCReservationFailedError,
  MetadataIncompleteError,
  PublicationError,
  PublicationFailedError,
  PublicationNotAuthorizedError,
  PublicationValidationFailedError,
  WorkflowConflictError,
} from "./publication.errors";

/** Maps lower-layer errors to publication errors — vendor details never leak */
export function mapToPublicationError(error: unknown): PublicationError {
  if (error instanceof PublicationError) return error;

  if (error instanceof ValidationFailedError) {
    return new PublicationValidationFailedError(error.message);
  }
  if (error instanceof ApplicationNotFoundError) {
    return new MetadataIncompleteError(error.message);
  }
  if (error instanceof ApplicationConflictError) {
    return new WorkflowConflictError(error.message);
  }
  if (error instanceof NotAuthorizedError) {
    return new PublicationNotAuthorizedError(error.message);
  }
  if (error instanceof ApplicationError) {
    return new PublicationFailedError(error.message);
  }
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("isrc")) {
      return new ISRCReservationFailedError(error.message);
    }
    return new PublicationFailedError(error.message);
  }
  return new PublicationFailedError("Erreur publication inconnue");
}
