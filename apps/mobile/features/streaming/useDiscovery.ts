import { useEffect, useMemo, useState } from "react";
import { createDiscoveryService } from "@sonafrik/api/discovery";
import type { DiscoveryArtist, DiscoveryTrack, NewReleasesResult } from "@sonafrik/types";
import { getSupabaseMobileClient } from "../../lib/supabase";

interface DiscoveryState {
  feed: DiscoveryTrack[];
  artists: DiscoveryArtist[];
  newReleases: NewReleasesResult | null;
  isLoading: boolean;
  error: string | null;
}

export function useDiscovery() {
  const discovery = useMemo(() => createDiscoveryService(getSupabaseMobileClient()), []);

  const [state, setState] = useState<DiscoveryState>({
    feed: [],
    artists: [],
    newReleases: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [feed, artists, newReleases] = await Promise.all([
          discovery.getDiscoveryFeed({ limit: 12 }),
          discovery.getSuggestedArtists({ limit: 8 }),
          discovery.getNewReleases({ type: "track", days: 21, limit: 10 }),
        ]);
        if (!cancelled) setState({ feed, artists, newReleases, isLoading: false, error: null });
      } catch {
        if (!cancelled)
          setState((prev) => ({ ...prev, isLoading: false, error: "Impossible de charger les découvertes." }));
      }
    }

    load();
    return () => { cancelled = true; };
  }, [discovery]);

  return state;
}
