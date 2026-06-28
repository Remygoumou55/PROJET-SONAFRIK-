import { unstable_cache } from "next/cache";
import { createListenerService } from "@sonafrik/api/listener";
import type { ListenerSidebarData } from "@sonafrik/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const EMPTY_SIDEBAR: ListenerSidebarData = {
  recentTracks: [],
  favoritesCount: 0,
  downloadsCount: 0,
};

async function fetchListenSidebarData(userId: string): Promise<ListenerSidebarData> {
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
}

/** Données sidebar auditeur — cache 60s par utilisateur. */
export function getListenSidebarData(userId: string): Promise<ListenerSidebarData> {
  return unstable_cache(
    () => fetchListenSidebarData(userId),
    ["listen-sidebar-data-v2", userId],
    { revalidate: 60, tags: ["listen-sidebar", `listen-sidebar-${userId}`] },
  )();
}
