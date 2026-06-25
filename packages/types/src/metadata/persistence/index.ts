/** Actor + correlation context for persistence operations — Zero Trust */
export interface PersistenceContext {
  readonly actorId: string;
  readonly correlationId: string;
  readonly initiatedAt: string;
}

/** Optimistic locking token */
export interface PersistenceVersion {
  readonly version: number;
  readonly updatedAt: string;
}

export const PERSISTENCE_ERROR_CODE = {
  UNKNOWN: "persistence_unknown",
  NOT_FOUND: "persistence_not_found",
  DUPLICATE: "persistence_duplicate",
  CONFLICT: "persistence_conflict",
  CONSTRAINT: "persistence_constraint",
  TRANSACTION: "persistence_transaction",
  TIMEOUT: "persistence_timeout",
  STORAGE: "persistence_storage",
  NOT_READY: "persistence_not_ready",
  VALIDATION: "persistence_validation",
} as const;

export type PersistenceErrorCode =
  (typeof PERSISTENCE_ERROR_CODE)[keyof typeof PERSISTENCE_ERROR_CODE];

export interface PersistenceQueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly cursor?: string;
}

export interface PersistenceBatchResult {
  readonly succeeded: number;
  readonly failed: number;
  readonly errors: readonly { index: number; message: string }[];
}

export interface PersistenceHealthStatus {
  readonly healthy: boolean;
  readonly provider: string;
  readonly latencyMs: number | null;
  readonly message: string | null;
}

export type PersistenceProviderKind = "memory" | "supabase" | "postgres" | "dynamo" | "mongo";
