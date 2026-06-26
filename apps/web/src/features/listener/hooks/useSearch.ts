"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResult, SearchType } from "@sonafrik/types";
import {
  buildSearchCacheKey,
  getCachedSearchResult,
  setCachedSearchResult,
} from "@sonafrik/shared/performance";
import { usePerformanceFlags } from "@/lib/performance";
import { useStreamingService } from "./useStreaming";

export function useSearch(beatStoreEnabled = false) {
  const performanceFlags = usePerformanceFlags();
  const cacheEnabled = performanceFlags.searchCacheEnabled;
  const streaming = useStreamingService();
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef = useRef(0);

  const search = useCallback(
    (query: string, type: SearchType = "all") => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!query.trim() || query.trim().length < 2) {
        setResults(null);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const currentId = ++searchIdRef.current;
        const cacheKey = buildSearchCacheKey(query, type);

        if (cacheEnabled) {
          const cached = getCachedSearchResult(cacheKey);
          if (cached) {
            if (currentId === searchIdRef.current) {
              setResults(cached);
              setError(null);
              setIsSearching(false);
            }
            return;
          }
        }

        setIsSearching(true);
        setError(null);
        try {
          const data = await streaming.search({
            query,
            limit: 20,
            type,
            includeBeats: beatStoreEnabled,
          });
          if (currentId === searchIdRef.current) {
            setResults(data);
            if (cacheEnabled) {
              setCachedSearchResult(cacheKey, data);
            }
          }
        } catch {
          if (currentId === searchIdRef.current) {
            setError("Recherche indisponible.");
            setResults(null);
          }
        } finally {
          if (currentId === searchIdRef.current) {
            setIsSearching(false);
          }
        }
      }, 300);
    },
    [streaming, cacheEnabled, beatStoreEnabled],
  );

  const clearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    searchIdRef.current++;
    setResults(null);
    setError(null);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { results, isSearching, error, search, clearSearch };
}
