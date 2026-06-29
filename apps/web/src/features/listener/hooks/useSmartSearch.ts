"use client";

import { useEffect, useRef, useState } from "react";
import type { ArtistResult, TrackWithMeta } from "@sonafrik/types";
import { filterValidArtists, filterValidTracks } from "@/lib/content-filter";
import { ldseCache } from "@/features/shared/ldse/cache";
import { searchLdseKey } from "@/features/shared/ldse/search/search-ldse-config";
import { useStreamingService } from "./useStreaming";

const DEBOUNCE_MS = 200;
const MAX_PER_TYPE = 5;

export interface SmartSearchResults {
  artists: ArtistResult[];
  tracks: TrackWithMeta[];
}

export function useSmartSearch() {
  const streaming = useStreamingService();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SmartSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    const currentId = ++searchIdRef.current;
    const cacheKey = searchLdseKey(debouncedQuery, "all", false);
    const cached = ldseCache.get<{ artists: ArtistResult[]; tracks: TrackWithMeta[] }>(cacheKey);
    if (cached) {
      setResults({
        artists: filterValidArtists(cached.artists).slice(0, MAX_PER_TYPE),
        tracks: filterValidTracks(cached.tracks).slice(0, MAX_PER_TYPE),
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    void streaming
      .search({ query: debouncedQuery, limit: MAX_PER_TYPE, type: "all" })
      .then((data) => {
        if (currentId !== searchIdRef.current) return;
        ldseCache.set(cacheKey, data, 120_000);
        setResults({
          artists: filterValidArtists(data.artists).slice(0, MAX_PER_TYPE),
          tracks: filterValidTracks(data.tracks).slice(0, MAX_PER_TYPE),
        });
      })
      .catch(() => {
        if (currentId !== searchIdRef.current) return;
        setResults({ artists: [], tracks: [] });
      })
      .finally(() => {
        if (currentId === searchIdRef.current) {
          setIsLoading(false);
        }
      });
  }, [debouncedQuery, streaming]);

  const clear = () => {
    searchIdRef.current++;
    setQuery("");
    setDebouncedQuery("");
    setResults(null);
    setIsLoading(false);
  };

  return { query, setQuery, debouncedQuery, results, isLoading, clear };
}
