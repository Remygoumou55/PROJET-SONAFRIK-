import type { LdseCacheEntry, LdseCacheKey, LdseCacheStats, LdseInvalidatePattern } from "./types";

const DEFAULT_TTL_MS = 30_000;

const store = new Map<LdseCacheKey, LdseCacheEntry<unknown>>();

let hits = 0;
let misses = 0;
let invalidations = 0;

function isStale(entry: LdseCacheEntry<unknown>): boolean {
  return Date.now() >= entry.staleAt;
}

/** Cache partagé LDSE — évite les requêtes dupliquées entre composants. */
export const ldseCache = {
  get<T>(key: LdseCacheKey): T | undefined {
    const entry = store.get(key) as LdseCacheEntry<T> | undefined;
    if (!entry) {
      misses += 1;
      return undefined;
    }
    if (isStale(entry)) {
      store.delete(key);
      misses += 1;
      return undefined;
    }
    entry.hits += 1;
    hits += 1;
    return entry.data;
  },

  peek<T>(key: LdseCacheKey): T | undefined {
    const entry = store.get(key) as LdseCacheEntry<T> | undefined;
    return entry?.data;
  },

  set<T>(key: LdseCacheKey, data: T, ttlMs = DEFAULT_TTL_MS): void {
    const now = Date.now();
    store.set(key, {
      data,
      fetchedAt: now,
      staleAt: now + ttlMs,
      hits: 0,
    });
  },

  invalidate(pattern: LdseInvalidatePattern): number {
    let removed = 0;
    if (typeof pattern === "string") {
      if (store.delete(pattern)) removed = 1;
    } else {
      for (const key of store.keys()) {
        if (pattern.test(key)) {
          store.delete(key);
          removed += 1;
        }
      }
    }
    invalidations += removed;
    return removed;
  },

  invalidateByEventPrefix(prefix: string): number {
    return ldseCache.invalidate(new RegExp(`^${prefix}`));
  },

  clear(): void {
    store.clear();
  },

  getStats(): LdseCacheStats {
    return { size: store.size, hits, misses, invalidations };
  },

  _resetForTests(): void {
    store.clear();
    hits = 0;
    misses = 0;
    invalidations = 0;
  },
};
