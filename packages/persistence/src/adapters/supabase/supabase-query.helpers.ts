import type { PersistenceQueryOptions } from "@sonafrik/types";
import type {
  SupabaseClientPort,
  SupabaseQueryBuilderPort,
  SupabaseQueryResult,
} from "./supabase-client.port";
import { mapVendorError } from "../../errors/persistence-errors";

export async function runQuery<T>(
  fn: () => Promise<SupabaseQueryResult<unknown>>,
): Promise<T> {
  try {
    const { data, error } = await fn();
    if (error) throw error;
    if (data === null) throw new Error("Aucune donnée retournée");
    return data as T;
  } catch (e) {
    throw mapVendorError(e);
  }
}

export async function runQueryNullable<T>(
  fn: () => Promise<SupabaseQueryResult<unknown>>,
): Promise<T | null> {
  try {
    const { data, error } = await fn();
    if (error) throw error;
    return (data as T | null) ?? null;
  } catch (e) {
    throw mapVendorError(e);
  }
}

export async function runVoidQuery(
  fn: () => PromiseLike<{ error: { message: string } | null }>,
): Promise<void> {
  try {
    const { error } = await fn();
    if (error) throw error;
  } catch (e) {
    throw mapVendorError(e);
  }
}

export function applyPagination(
  query: SupabaseQueryBuilderPort,
  options?: PersistenceQueryOptions,
): SupabaseQueryBuilderPort {
  let q = query;
  if (options?.limit !== undefined) {
    q = q.limit(options.limit);
  }
  if (options?.offset !== undefined) {
    const limit = options.limit ?? 100;
    q = q.range(options.offset, options.offset + limit - 1);
  }
  return q;
}

export function fromTable(client: SupabaseClientPort, table: string): SupabaseQueryBuilderPort {
  return client.from(table);
}
