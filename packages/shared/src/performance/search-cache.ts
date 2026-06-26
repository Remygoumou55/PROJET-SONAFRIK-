import type { SearchResult, SearchType } from "@sonafrik/types";
import { SEARCH_RESULT_CACHE_TTL_MS } from "./constants";

interface CacheEntry {
  readonly data: SearchResult;
  readonly expiresAt: number;
}

const searchResultCache = new Map<string, CacheEntry>();

export function buildSearchCacheKey(query: string, type: SearchType): string {
  return `${query.trim().toLowerCase()}::${type}`;
}

export function getCachedSearchResult(key: string, now = Date.now()): SearchResult | null {
  const entry = searchResultCache.get(key);
  if (!entry) return null;
  if (now > entry.expiresAt) {
    searchResultCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedSearchResult(
  key: string,
  data: SearchResult,
  now = Date.now(),
  ttlMs = SEARCH_RESULT_CACHE_TTL_MS,
): void {
  searchResultCache.set(key, {
    data,
    expiresAt: now + ttlMs,
  });
}

export function clearSearchResultCache(): void {
  searchResultCache.clear();
}
