import { unstable_cache } from "next/cache";

export type PublicCacheOptions = {
  revalidate?: number | false;
  tags?: string[];
};

/**
 * Cache cross-request (unstable_cache) pour données publiques Supabase.
 *
 * Règle Next.js 15 : le fetcher ne doit JAMAIS appeler cookies(), headers(),
 * getSupabaseServerClient() ni requireIdentityContext().
 * Utiliser uniquement getSupabasePublicClient().
 */
export function createPublicCachedQuery<T>(
  cacheKey: string | readonly string[],
  fetcher: () => Promise<T>,
  options: PublicCacheOptions = {},
): () => Promise<T> {
  const key = typeof cacheKey === "string" ? [cacheKey] : [...cacheKey];
  return unstable_cache(fetcher, key, {
    revalidate: options.revalidate ?? 60,
    tags: options.tags,
  });
}
