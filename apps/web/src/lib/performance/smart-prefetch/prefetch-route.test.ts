import { describe, expect, it, beforeEach, vi } from "vitest";
import { prefetchRoute, prefetchRoutes, resetPrefetchCacheForTests } from "./prefetch-route";

describe("prefetch-route", () => {
  const router = { prefetch: vi.fn() };

  beforeEach(() => {
    resetPrefetchCacheForTests();
    router.prefetch.mockClear();
  });

  it("prefetches a route once per session cache", () => {
    prefetchRoute(router, "/listen");
    prefetchRoute(router, "/listen");

    expect(router.prefetch).toHaveBeenCalledTimes(1);
    expect(router.prefetch).toHaveBeenCalledWith("/listen");
  });

  it("ignores empty href", () => {
    prefetchRoute(router, "");
    expect(router.prefetch).not.toHaveBeenCalled();
  });

  it("deduplicates batch prefetch", () => {
    prefetchRoutes(router, ["/listen", "/listen", "/library"], { idle: false });

    expect(router.prefetch).toHaveBeenCalledTimes(2);
    expect(router.prefetch).toHaveBeenCalledWith("/listen");
    expect(router.prefetch).toHaveBeenCalledWith("/library");
  });
});
