import { createPublicCachedQuery } from "@/lib/cache";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import { resolvePerformanceFlags } from "./resolve-performance-flags";
import { DEFAULT_PERFORMANCE_FLAGS, type PerformanceFlags } from "./types";

const CACHE_KEY = "performance-feature-flags-v1";
const REVALIDATE_SECONDS = 120;

/** Flags performance — cache 120s, évite 1 requête DB par layout. */
export const getCachedPerformanceFlags = createPublicCachedQuery(
  CACHE_KEY,
  async (): Promise<PerformanceFlags> => {
    try {
      const client = getSupabasePublicClient();
      return await resolvePerformanceFlags(client);
    } catch {
      return DEFAULT_PERFORMANCE_FLAGS;
    }
  },
  { revalidate: REVALIDATE_SECONDS, tags: ["performance-flags"] },
);
