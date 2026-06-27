"use client";

import { useEffect, useState } from "react";
import type { LyricLine } from "@sonafrik/types";
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
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("track_lyrics")
        .select("lines")
        .eq("track_id", id)
        .eq("status", "approved")
        .eq("language", "fr")
        .maybeSingle();

      if (cancelled) return;

      if (error || !data?.lines || !Array.isArray(data.lines)) {
        setLines([]);
        setHasLyrics(false);
      } else {
        const raw = data.lines as unknown;
        const parsed = Array.isArray(raw)
          ? raw.filter(
              (line): line is LyricLine =>
                typeof line === "object" &&
                line !== null &&
                "time" in line &&
                "text" in line &&
                typeof (line as LyricLine).time === "number" &&
                typeof (line as LyricLine).text === "string",
            )
          : [];
        setLines(parsed);
        setHasLyrics(parsed.length > 0);
      }
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [trackId, synchronizedLyrics]);

  return { lines, isLoading, hasLyrics };
}
