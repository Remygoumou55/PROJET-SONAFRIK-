import type { IssuedSignedUrl } from "@sonafrik/types";

interface CacheEntry extends IssuedSignedUrl {
  readonly cacheKey: string;
  readonly cachedAtMs: number;
}

/** In-memory signed URL cache — TTL + renewal without session break */
export class SignedUrlCache {
  private readonly entries = new Map<string, CacheEntry>();

  cacheKey(trackId: string, actorId: string, qualityKbps: number | null): string {
    return `${actorId}:${trackId}:${qualityKbps ?? "auto"}`;
  }

  get(key: string): IssuedSignedUrl | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (this.isExpired(entry.expiresAt)) {
      this.entries.delete(key);
      return null;
    }
    return entry;
  }

  set(key: string, value: IssuedSignedUrl): void {
    this.entries.set(key, { ...value, cacheKey: key, cachedAtMs: Date.now() });
  }

  invalidate(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  isExpired(expiresAt: string, nowMs: number = Date.now()): boolean {
    return new Date(expiresAt).getTime() <= nowMs;
  }
}
