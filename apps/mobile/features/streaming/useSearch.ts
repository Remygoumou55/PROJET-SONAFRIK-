import { useCallback, useMemo, useRef, useState } from "react";
import { createStreamingService } from "@sonafrik/api/streaming";
import type { SearchResult } from "@sonafrik/types";
import { getSupabaseMobileClient } from "../../lib/supabase";

export function useSearch() {
  const streaming = useMemo(() => createStreamingService(getSupabaseMobileClient()), []);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query.trim()) {
        setResults(null);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        setError(null);
        try {
          const data = await streaming.search({ query, limit: 20 });
          setResults(data);
        } catch {
          setError("Recherche indisponible.");
          setResults(null);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    },
    [streaming],
  );

  const clearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults(null);
    setError(null);
  }, []);

  return { results, isSearching, error, search, clearSearch };
}
