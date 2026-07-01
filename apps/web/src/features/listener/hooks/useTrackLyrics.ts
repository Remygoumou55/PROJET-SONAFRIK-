"use client";

import { useEffect, useState } from "react";
import type { LyricLine } from "@sonafrik/types";
import { createListenerService } from "@sonafrik/api/listener";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useListenFeatures } from "../lib/listenFeaturesContext";

export type { LyricLine };

export function useTrackLyrics(trackId: string | null) {
  const { synchronizedLyrics } = useListenFeatures();
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLyrics, setHasLyrics] = useState(false);

  useEffect(() => {
    if (!trackId || !synchronizedLyrics) {
      setLines([]);
      setHasLyrics(false);
      return;
    }

    let cancelled = false;
    const id = trackId;

    async function load() {
      setIsLoading(true);
      try {
        const listener = createListenerService(getSupabaseBrowserClient());
        const { lines: parsed } = await listener.getTrackLyrics(id);
        if (cancelled) return;
        setLines(parsed);
        setHasLyrics(parsed.length > 0);
      } catch {
        if (!cancelled) {
          setLines([]);
          setHasLyrics(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [trackId, synchronizedLyrics]);

  return { lines, isLoading, hasLyrics };
}
