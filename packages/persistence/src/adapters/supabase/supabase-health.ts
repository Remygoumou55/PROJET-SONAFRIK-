import type { PersistenceHealthStatus, PersistenceProviderKind } from "@sonafrik/types";
import type { PersistenceHealthProbe } from "../../core/persistence-store";
import { METADATA_TABLES, type SupabaseClientPort } from "./supabase-client.port";
import { mapVendorError } from "../../errors/persistence-errors";
import { fromTable } from "./supabase-query.helpers";

export class SupabaseHealthProbe implements PersistenceHealthProbe {
  constructor(
    private readonly client: SupabaseClientPort,
    private readonly provider: PersistenceProviderKind = "supabase",
  ) {}

  async checkHealth(): Promise<PersistenceHealthStatus> {
    const start = Date.now();
    try {
      const { error } = await fromTable(this.client, METADATA_TABLES.HEALTH)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return {
        healthy: true,
        provider: this.provider,
        latencyMs: Date.now() - start,
        message: null,
      };
    } catch (e) {
      const normalized = mapVendorError(e);
      return {
        healthy: false,
        provider: this.provider,
        latencyMs: Date.now() - start,
        message: normalized.message,
      };
    }
  }
}

/** Wraps real SupabaseClient as port — used only in packages/api wiring Phase 3.5+ */
export function createSupabaseClientPort(client: {
  from(table: string): SupabaseClientPort["from"] extends (t: string) => infer R ? R : never;
  rpc?: SupabaseClientPort["rpc"];
}): SupabaseClientPort {
  return {
    from: (table: string) => client.from(table) as ReturnType<SupabaseClientPort["from"]>,
    rpc: (fn, params) =>
      client.rpc?.(fn, params) ?? Promise.resolve({ data: null, error: { message: "rpc unavailable" } }),
  };
}
