import type { SearchType } from "@sonafrik/types";

/** Clé cache LDSE — recherche unifiée (page + smart search). */
export function searchLdseKey(query: string, type: SearchType = "all", includeBeats = false): string {
  const q = query.trim().toLowerCase();
  return `search:${type}:${includeBeats ? "beats" : "no-beats"}:${q}`;
}

export const SEARCH_LDSE_EVENTS = {
  executed: "search.executed",
  invalidate: "search.invalidate",
} as const;
