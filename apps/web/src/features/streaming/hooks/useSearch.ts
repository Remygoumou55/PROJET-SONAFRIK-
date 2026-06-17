"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResult } from "@sonafrik/types";
import { useStreamingService } from "./useStreaming";

export function useSearch() {
  const streaming = useStreamingService();
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef = useRef(0);

  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!query.trim()) {
        setResults(null);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const currentId = ++searchIdRef.current;
        setIsSearching(true);
        setError(null);
        try {
          const data = await streaming.search({ query, limit: 20 });
          if (currentId === searchIdRef.current) {
            setResults(data);
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
      }, 450);
    },
    [streaming],
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
