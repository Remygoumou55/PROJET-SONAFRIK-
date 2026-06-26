import { describe, expect, it, beforeEach } from "vitest";
import type { SearchResult } from "@sonafrik/types";
import {
  buildSearchCacheKey,
  clearSearchResultCache,
  getCachedSearchResult,
  setCachedSearchResult,
} from "./search-cache";

const sample: SearchResult = {
  tracks: [],
  artists: [],
  albums: [],
  playlists: [],
  beats: [],
  total: 0,
  query: "test",
  type: "all",
};

describe("search-cache", () => {
  beforeEach(() => {
    clearSearchResultCache();
  });

  it("buildSearchCacheKey normalise la requête", () => {
    expect(buildSearchCacheKey("  Amadou  ", "all")).toBe("amadou::all");
  });

  it("retourne null si entrée absente ou expirée", () => {
    const key = buildSearchCacheKey("test", "tracks");
    expect(getCachedSearchResult(key, 1000)).toBeNull();

    setCachedSearchResult(key, sample, 1000, 500);
    expect(getCachedSearchResult(key, 1200)).toEqual(sample);
    expect(getCachedSearchResult(key, 1501)).toBeNull();
  });

  it("isole les types de recherche", () => {
    setCachedSearchResult(buildSearchCacheKey("a", "all"), sample, 0, 10_000);
    expect(getCachedSearchResult(buildSearchCacheKey("a", "tracks"), 0)).toBeNull();
  });
});
