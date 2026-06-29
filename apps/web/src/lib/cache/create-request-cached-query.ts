import { cache } from "react";

/**
 * Déduplication intra-requête (React cache) pour données session / utilisateur.
 *
 * Le fetcher PEUT utiliser getSupabaseServerClient(), cookies(), requireIdentityContext().
 * Ne pas wrapper dans unstable_cache — incompatible avec les dynamic data sources.
 */
export function createRequestCachedQuery<TArgs extends unknown[], TResult>(
  fetcher: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return cache(fetcher);
}
