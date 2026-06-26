/** Cache mémoire des URLs signées creator-assets — évite N appels edge identiques. */
const TTL_MS = 50 * 60 * 1000; // 50 min (< 3600s edge TTL)

const cache = new Map<string, { url: string; expiresAt: number }>();

function cacheKey(creatorId: string, path: string): string {
  return `${creatorId}:${path}`;
}

export function getCachedCreatorAssetUrl(creatorId: string, path: string): string | null {
  const hit = cache.get(cacheKey(creatorId, path));
  if (!hit) return null;
  if (Date.now() >= hit.expiresAt) {
    cache.delete(cacheKey(creatorId, path));
    return null;
  }
  return hit.url;
}

export function setCachedCreatorAssetUrl(creatorId: string, path: string, url: string): void {
  cache.set(cacheKey(creatorId, path), { url, expiresAt: Date.now() + TTL_MS });
}

export function invalidateCreatorAssetUrl(creatorId: string, path?: string): void {
  if (!path) {
    for (const key of cache.keys()) {
      if (key.startsWith(`${creatorId}:`)) cache.delete(key);
    }
    return;
  }
  cache.delete(cacheKey(creatorId, path));
}
