import { createRequestCachedQuery } from "@/lib/cache";
import { createListenerService } from "@sonafrik/api/listener";
import type { ListenerSidebarData } from "@sonafrik/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const EMPTY_SIDEBAR: ListenerSidebarData = {
  recentTracks: [],
  favoritesCount: 0,
  downloadsCount: 0,
};

/** Données sidebar auditeur — session utilisateur (React cache, pas unstable_cache). */
export const getListenSidebarData = createRequestCachedQuery(
  async (userId: string): Promise<ListenerSidebarData> => {
    try {
      const supabase = await getSupabaseServerClient();
      const listener = createListenerService(supabase);

      const [recentTracks, counts] = await Promise.all([
        listener.getRecentlyPlayed(userId, 3),
        listener.getSidebarCounts(userId),
      ]);

      return {
        recentTracks,
        favoritesCount: counts.favoritesCount,
        downloadsCount: counts.downloadsCount,
      };
    } catch {
      return EMPTY_SIDEBAR;
    }
  },
);
