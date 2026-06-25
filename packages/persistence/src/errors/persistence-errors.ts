import type { PersistenceErrorCode } from "@sonafrik/types";

export const PERSISTENCE_ERROR_MESSAGES: Record<PersistenceErrorCode, string> = {
  persistence_unknown: "Une erreur de persistance est survenue.",
  persistence_not_found: "Enregistrement introuvable.",
  persistence_duplicate: "Enregistrement en double.",
  persistence_conflict: "Conflit de persistance (optimistic lock).",
  persistence_constraint: "Violation de contrainte.",
  persistence_transaction: "Erreur transactionnelle.",
  persistence_timeout: "Timeout de persistance.",
  persistence_storage: "Stockage indisponible.",
  persistence_not_ready: "Couche de persistance non prête (migration Phase 3.5).",
  persistence_validation: "Données de persistance invalides.",
};

export class PersistenceError extends Error {
  readonly code: PersistenceErrorCode;

  constructor(code: PersistenceErrorCode, message?: string) {
    super(message ?? PERSISTENCE_ERROR_MESSAGES[code]);
    this.name = "PersistenceError";
    this.code = code;
  }
}

export class RepositoryError extends PersistenceError {
  constructor(message?: string) {
    super("persistence_unknown", message);
    this.name = "RepositoryError";
  }
}

export class TransactionError extends PersistenceError {
  constructor(message?: string) {
    super("persistence_transaction", message);
    this.name = "TransactionError";
  }
}

export class TimeoutError extends PersistenceError {
  constructor(message?: string) {
    super("persistence_timeout", message);
    this.name = "TimeoutError";
  }
}

export class ConflictError extends PersistenceError {
  constructor(message?: string) {
    super("persistence_conflict", message);
    this.name = "ConflictError";
  }
}

export class DuplicateError extends PersistenceError {
  constructor(message?: string) {
    super("persistence_duplicate", message);
    this.name = "DuplicateError";
  }
}

export class NotFoundError extends PersistenceError {
  constructor(message?: string) {
    super("persistence_not_found", message);
    this.name = "NotFoundError";
  }
}

export class ConstraintError extends PersistenceError {
  constructor(message?: string) {
    super("persistence_constraint", message);
    this.name = "ConstraintError";
  }
}

export class StorageError extends PersistenceError {
  constructor(message?: string) {
    super("persistence_storage", message);
    this.name = "StorageError";
  }
}

export class PersistenceNotReadyError extends PersistenceError {
  constructor(message?: string) {
    super("persistence_not_ready", message);
    this.name = "PersistenceNotReadyError";
  }
}

/** Maps vendor errors to normalized persistence errors — never leak Supabase/Postgres details */
export function mapVendorError(error: unknown): PersistenceError {
  if (error instanceof PersistenceError) return error;

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return new TimeoutError(message);
  }
  if (lower.includes("duplicate") || lower.includes("unique") || lower.includes("23505")) {
    return new DuplicateError(message);
  }
  if (lower.includes("not found") || lower.includes("pgrst116") || lower.includes("0 rows")) {
    return new NotFoundError(message);
  }
  if (lower.includes("conflict") || lower.includes("version")) {
    return new ConflictError(message);
  }
  if (lower.includes("constraint") || lower.includes("foreign key") || lower.includes("23503")) {
    return new ConstraintError(message);
  }
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return new PersistenceNotReadyError("Table metadata non migrée (Phase 3.5)");
  }

  return new StorageError(message);
}
