import { unstable_cache } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import {
  DEFAULT_LISTEN_FEATURE_FLAGS,
  resolveListenFeatureFlags,
  type ListenFeatureFlags,
} from "./listen-feature-flags";

const CACHE_KEY = "listen-feature-flags-v3";
const REVALIDATE_SECONDS = 120;

/** Flags /listen — cache 120s, évite 1 requête DB par layout listener. */
export const getCachedListenFeatureFlags = unstable_cache(
  async (): Promise<ListenFeatureFlags> => {
    try {
      const client = getSupabasePublicClient();
      return await resolveListenFeatureFlags(client);
    } catch {
      return DEFAULT_LISTEN_FEATURE_FLAGS;
    }
  },
  [CACHE_KEY],
  { revalidate: REVALIDATE_SECONDS, tags: ["listen-feature-flags"] },
);

export function hasAnyListenFeature(flags: ListenFeatureFlags): boolean {
  return (
    flags.fullscreenPlayer ||
    flags.queuePanel ||
    flags.whatsappShare ||
    flags.discoverMode ||
    flags.synchronizedLyrics
  );
}
