"use client";

import { useEffect, useState } from "react";
import type { TrackCredit } from "@sonafrik/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useTrackCredits(trackId: string | null | undefined) {
  const [credits, setCredits] = useState<TrackCredit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trackId) {
      setCredits([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const { data } = await getSupabaseBrowserClient()
          .from("track_credits")
          .select("*")
          .eq("track_id", trackId)
          .order("display_order");
        if (!cancelled) setCredits((data ?? []) as TrackCredit[]);
      } catch {
        // silently ignore — credits are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [trackId]);

  return { credits, loading };
}
