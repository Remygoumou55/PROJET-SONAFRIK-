import type {
  PersistenceBatchResult,
  PersistenceContext,
  PersistenceHealthStatus,
  PersistenceQueryOptions,
} from "@sonafrik/types";

/** Base persistence store contract — technology agnostic */
export interface PersistenceStore<TEntity, TId = string> {
  save(entity: TEntity, context: PersistenceContext): Promise<TEntity>;
  update(entity: TEntity, context: PersistenceContext): Promise<TEntity>;
  delete(id: TId, context: PersistenceContext): Promise<void>;
  restore(id: TId, context: PersistenceContext): Promise<TEntity>;
  findById(id: TId, context: PersistenceContext): Promise<TEntity | null>;
  exists(id: TId, context: PersistenceContext): Promise<boolean>;
  search(
    filter: Readonly<Record<string, unknown>>,
    context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly TEntity[]>;
}

/** Transaction boundary — adapters implement, engine never sees vendor APIs */
export interface PersistenceTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface TransactionOptions {
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly idempotencyKey?: string;
}

export interface PersistenceTransactionManager {
  runInTransaction<T>(
    fn: (tx: PersistenceTransaction) => Promise<T>,
    context: PersistenceContext,
    options?: TransactionOptions,
  ): Promise<T>;
}

/** Batch operations — interfaces only, no premature bulk impl */
export interface PersistenceBatchWriter<TEntity> {
  insertMany(
    entities: readonly TEntity[],
    context: PersistenceContext,
  ): Promise<PersistenceBatchResult>;
  updateMany(
    entities: readonly TEntity[],
    context: PersistenceContext,
  ): Promise<PersistenceBatchResult>;
}

/** Stream loading — cursor-based pagination contract */
export interface PersistenceStreamLoader<TEntity> {
  stream(
    filter: Readonly<Record<string, unknown>>,
    context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): AsyncIterable<TEntity>;
}

/** Health probe for adapters */
export interface PersistenceHealthProbe {
  checkHealth(): Promise<PersistenceHealthStatus>;
}

/** Cache strategy hook — prepare only */
export interface PersistenceCacheStrategy {
  readonly name: string;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  invalidate(key: string): Promise<void>;
}
