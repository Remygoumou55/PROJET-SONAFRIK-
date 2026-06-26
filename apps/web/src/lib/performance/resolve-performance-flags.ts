import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { PerformanceFlags } from "./types";

const PERFORMANCE_FLAG_NAMES = [
  "performance_search_cache_enabled",
  "performance_animation_cdc_compliant_enabled",
  "performance_africa_mode_enabled",
] as const;

/** Résout les flags performance côté serveur (une seule requête DB). */
export async function resolvePerformanceFlags(
  client: SonafrikSupabaseClient,
): Promise<PerformanceFlags> {
  const { data, error } = await client
    .from("feature_flags")
    .select("name, enabled")
    .in("name", [...PERFORMANCE_FLAG_NAMES]);

  if (error) throw error;

  const byName = new Map(
    (data ?? []).map((row) => [row.name as string, row.enabled as boolean]),
  );

  const searchCacheEnabled = byName.get("performance_search_cache_enabled") ?? false;
  const animationsCdcCompliant =
    byName.get("performance_animation_cdc_compliant_enabled") ?? false;
  const africaMode = byName.get("performance_africa_mode_enabled") ?? false;

  return {
    searchCacheEnabled,
    animationsCdcCompliant,
    africaMode,
    routePrefetchEnabled: !africaMode,
  };
}
