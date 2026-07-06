"use client";

import { getListenerHubInvalidateEvents, shouldRefreshListenerCatalog } from "@sonafrik/realtime/adapters";
import { useEventSubscription } from "@sonafrik/realtime/react";
import { ldseCache } from "@/features/shared/ldse/cache";
import { searchLdseKey } from "@/features/shared/ldse/search/search-ldse-config";
import type { SearchType } from "@sonafrik/types";

/** Invalide le cache recherche auditeur sur événements catalogue SRTSP (Phase 3.8). */
export function useSearchSrtspInvalidation(
  activeQuery: string,
  activeType: SearchType,
  beatStoreEnabled: boolean,
  onInvalidate?: () => void,
) {
  useEventSubscription(
    getListenerHubInvalidateEvents(),
    (event) => {
      if (!shouldRefreshListenerCatalog(event)) return;
      ldseCache.invalidateByEventPrefix("search:");
      if (activeQuery.trim().length >= 2) {
        ldseCache.invalidate(searchLdseKey(activeQuery, activeType, beatStoreEnabled));
      }
      onInvalidate?.();
    },
    true,
  );
}
