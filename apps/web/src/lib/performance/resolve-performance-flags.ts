import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { DEFAULT_PERFORMANCE_FLAGS, type PerformanceFlags } from "./types";

const PERFORMANCE_FLAG_NAMES = [
  "performance_search_cache_enabled",
  "performance_animation_cdc_compliant_enabled",
  "performance_africa_mode_enabled",
] as const;

const FLAG_FETCH_TIMEOUT_MS = 2_500;

/** Résout les flags performance côté serveur (une seule requête DB). */
export async function resolvePerformanceFlags(
  client: SonafrikSupabaseClient,
): Promise<PerformanceFlags> {
  try {
    const fetchFlags = client
      .from("feature_flags")
      .select("name, enabled")
      .in("name", [...PERFORMANCE_FLAG_NAMES])
      .then(({ data, error }) => {
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
        } satisfies PerformanceFlags;
      });

    const timeout = new Promise<PerformanceFlags>((_, reject) => {
      setTimeout(() => reject(new Error("performance_flags_timeout")), FLAG_FETCH_TIMEOUT_MS);
    });

    return await Promise.race([fetchFlags, timeout]);
  } catch {
    return DEFAULT_PERFORMANCE_FLAGS;
  }
}
