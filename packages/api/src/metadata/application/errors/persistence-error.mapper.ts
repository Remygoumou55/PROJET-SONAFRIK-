import { PersistenceError } from "@sonafrik/persistence";
import {
  ApplicationConflictError,
  ApplicationError,
  ApplicationNotFoundError,
  ValidationFailedError,
} from "./application.errors";

/** Maps persistence errors to application errors — vendor details never leak */
export function mapPersistenceToApplication(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) return error;

  if (error instanceof PersistenceError) {
    switch (error.code) {
      case "persistence_not_found":
        return new ApplicationNotFoundError(error.message);
      case "persistence_duplicate":
      case "persistence_conflict":
        return new ApplicationConflictError(error.message);
      case "persistence_validation":
        return new ValidationFailedError(error.message);
      default:
        return new ApplicationError("application_unknown", error.message);
    }
  }

  if (error instanceof Error) {
    return new ApplicationError("application_unknown", error.message);
  }

  return new ApplicationError("application_unknown", "Erreur application inconnue");
}
