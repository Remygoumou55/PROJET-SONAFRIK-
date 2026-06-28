"use client";

import { useEffect, useState } from "react";
import type { TrackListenCounts } from "@sonafrik/types";

/** Compteurs d'écoutes valides pour le morceau en cours (API listener). */
export function useTrackListenCounts(trackId: string | null | undefined) {
  const [counts, setCounts] = useState<TrackListenCounts | null>(null);

  useEffect(() => {
    if (!trackId) {
      setCounts(null);
      return;
    }

    let cancelled = false;

    fetch(`/api/listener/track/${trackId}/listen-count`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TrackListenCounts | null) => {
        if (!cancelled && data) setCounts(data);
      })
      .catch(() => {
        if (!cancelled) setCounts(null);
      });

    const onValidListen = (event: Event) => {
      const detail = (event as CustomEvent<{ trackId: string }>).detail;
      if (detail?.trackId === trackId) {
        fetch(`/api/listener/track/${trackId}/listen-count`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data: TrackListenCounts | null) => {
            if (!cancelled && data) setCounts(data);
          })
          .catch(() => {});
      }
    };

    window.addEventListener("sonafrik:valid-listen", onValidListen);
    return () => {
      cancelled = true;
      window.removeEventListener("sonafrik:valid-listen", onValidListen);
    };
  }, [trackId]);

  return counts;
}
