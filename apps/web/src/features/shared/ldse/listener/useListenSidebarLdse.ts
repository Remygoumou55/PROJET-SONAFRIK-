"use client";

import { useCallback, useEffect, useState } from "react";
import type { ListenerSidebarData } from "@sonafrik/types";
import { createListenerService } from "@sonafrik/api/listener";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ldseCache } from "@/features/shared/ldse/cache";
import { useLdseEvent } from "@/features/shared/ldse/LdseProvider";
import {
  LISTENER_LDSE_EVENTS,
  LISTENER_LDSE_KEYS,
} from "@/features/shared/ldse/listener/listener-ldse-config";

/** Sidebar auditeur synchronisée LDSE — compteurs live après favoris/playlists. */
export function useListenSidebarLdse(userId: string, initial: ListenerSidebarData) {
  const cacheKey = LISTENER_LDSE_KEYS.sidebar(userId);
  const [sidebarData, setSidebarData] = useState<ListenerSidebarData>(() => {
    return ldseCache.get<ListenerSidebarData>(cacheKey) ?? initial;
  });

  const refreshCounts = useCallback(async () => {
    if (!userId) return;
    try {
      const listener = createListenerService(getSupabaseBrowserClient());
      const [recentTracks, counts] = await Promise.all([
        listener.getRecentlyPlayed(userId, 3),
        listener.getSidebarCounts(userId),
      ]);
      const next: ListenerSidebarData = {
        recentTracks,
        favoritesCount: counts.favoritesCount,
        downloadsCount: counts.downloadsCount,
      };
      ldseCache.set(cacheKey, next, 30_000);
      setSidebarData(next);
    } catch {
      /* garde la dernière valeur connue */
    }
  }, [userId, cacheKey]);

  useEffect(() => {
    ldseCache.set(cacheKey, initial, 30_000);
    setSidebarData(initial);
  }, [cacheKey, initial]);

  useLdseEvent(LISTENER_LDSE_EVENTS.favoriteToggled, (event) => {
    if (event.payload?.userId === userId) void refreshCounts();
  });

  useLdseEvent(LISTENER_LDSE_EVENTS.playlistUpdated, (event) => {
    if (event.payload?.userId === userId) void refreshCounts();
  });

  useLdseEvent(LISTENER_LDSE_EVENTS.sidebarInvalidate, (event) => {
    if (event.payload?.userId === userId) void refreshCounts();
  });

  return sidebarData;
}
