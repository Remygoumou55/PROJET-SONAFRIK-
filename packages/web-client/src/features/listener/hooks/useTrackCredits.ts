"use client";

import { useEffect, useMemo, useState } from "react";
import type { TrackCredit } from "@sonafrik/types";
import { createCatalogService } from "@sonafrik/api/catalog";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

export function useTrackCredits(trackId: string | null | undefined) {
  const catalog = useMemo(() => createCatalogService(getSupabaseBrowserClient()), []);
  const [credits, setCredits] = useState<TrackCredit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trackId) {
      setCredits([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void catalog.getTrackCredits(trackId).then((data) => {
      if (!cancelled) setCredits(data);
    }).catch(() => {
      // silently ignore — credits are non-critical
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [trackId, catalog]);

  return { credits, loading };
}
