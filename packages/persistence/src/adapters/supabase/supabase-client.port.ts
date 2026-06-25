/** Supabase client port — Metadata Engine never imports @supabase/supabase-js */

export interface SupabaseQueryResult<T = unknown> {
  readonly data: T | null;
  readonly error: { readonly message: string; readonly code?: string } | null;
}

export interface SupabaseQueryBuilderPort {
  select(columns?: string): SupabaseQueryBuilderPort;
  insert(row: Record<string, unknown> | readonly Record<string, unknown>[]): SupabaseQueryBuilderPort;
  upsert(row: Record<string, unknown> | readonly Record<string, unknown>[]): SupabaseQueryBuilderPort;
  update(row: Record<string, unknown>): SupabaseQueryBuilderPort;
  delete(): SupabaseQueryBuilderPort;
  eq(column: string, value: unknown): SupabaseQueryBuilderPort;
  limit(count: number): SupabaseQueryBuilderPort;
  order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilderPort;
  range(from: number, to: number): SupabaseQueryBuilderPort;
  single(): Promise<SupabaseQueryResult>;
  maybeSingle(): Promise<SupabaseQueryResult>;
  then<TResult1 = SupabaseQueryResult, TResult2 = never>(
    onfulfilled?: ((value: SupabaseQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

export interface SupabaseClientPort {
  from(table: string): SupabaseQueryBuilderPort;
  rpc(
    fn: string,
    params?: Record<string, unknown>,
  ): Promise<SupabaseQueryResult<unknown>>;
}

/** Table names — Phase 3.5 migrations */
export const METADATA_TABLES = {
  RECORDS: "metadata_records",
  ISRC_REGISTRY: "metadata_isrc_registry",
  ISRC_SEQUENCE: "metadata_isrc_sequence",
  UPC_REGISTRY: "metadata_upc_registry",
  REGISTRY_INDEX: "metadata_registry_index",
  AUDIT: "metadata_audit_log",
  VERSIONS: "metadata_version_snapshots",
  RELEASES: "metadata_release_records",
  FINGERPRINTS: "metadata_fingerprint_records",
  HEALTH: "metadata_platform_health",
} as const;

export const METADATA_RPC = {
  ADVANCE_ISRC_SEQUENCE: "metadata_advance_isrc_sequence",
  RESERVE_ISRC: "metadata_reserve_isrc",
  RESERVE_UPC: "metadata_reserve_upc",
} as const;
