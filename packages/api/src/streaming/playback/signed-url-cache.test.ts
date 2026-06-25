import { describe, expect, it } from "vitest";
import { SignedUrlCache } from "./signed-url-cache";

describe("SignedUrlCache", () => {
  it("cache et expire les URLs", () => {
    const cache = new SignedUrlCache();
    const key = cache.cacheKey("track-1", "user-1", 128);
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    cache.set(key, {
      sessionId: "s1",
      signedUrl: "https://test/audio",
      expiresAt,
      durationSeconds: 180,
    });
    expect(cache.get(key)?.sessionId).toBe("s1");
    expect(cache.isExpired(expiresAt, Date.now() + 120_000)).toBe(true);
    cache.invalidate(key);
    expect(cache.get(key)).toBeNull();
  });

  it("purge les entrées expirées au get et clear", () => {
    const cache = new SignedUrlCache();
    const key = cache.cacheKey("t", "u", null);
    const expiredAt = new Date(Date.now() - 1_000).toISOString();
    cache.set(key, {
      sessionId: "s",
      signedUrl: "https://test/expired",
      expiresAt: expiredAt,
      durationSeconds: 180,
    });
    expect(cache.get(key)).toBeNull();
    cache.set(key, {
      sessionId: "s2",
      signedUrl: "https://test/ok",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      durationSeconds: 180,
    });
    cache.clear();
    expect(cache.get(key)).toBeNull();
  });
});
