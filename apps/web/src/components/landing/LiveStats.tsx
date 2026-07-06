"use client";

import { useCallback, useEffect, useState } from "react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useInView } from "@/hooks/useInView";
import type { LandingPublicStats } from "@/lib/landing/constants";

const POLL_MS = 30_000;

function StatColumn({
  value,
  label,
  colorClass,
  animate,
  liveDot = false,
}: {
  value: number;
  label: string;
  colorClass: string;
  animate: boolean;
  liveDot?: boolean;
}) {
  const display = useAnimatedNumber(value, animate);

  return (
    <div className="flex flex-1 flex-col items-center gap-1 text-center">
      <div className="flex items-center gap-2">
        {liveDot ? <span className="live-dot" aria-hidden="true" /> : null}
        <span className={`text-[28px] font-bold leading-none ${colorClass}`}>
          {display.toLocaleString("fr-FR")}
        </span>
      </div>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  );
}

export function LiveStats() {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  const [stats, setStats] = useState<LandingPublicStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/landing/stats", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as LandingPublicStats;
      setStats(data.visible ? data : null);
    } catch {
      setStats(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const shellClass =
    "mb-12 border-y border-vert-energie/15 bg-vert-energie/5 px-4 py-4 min-h-[72px]";

  if (!loaded) {
    return <div ref={ref} className={shellClass} aria-hidden="true" />;
  }

  if (!stats) return null;

  return (
    <div ref={ref} role="region" aria-label="Statistiques en direct" className={shellClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
        <StatColumn
          value={stats.activeStreams}
          label="en train d'écouter"
          colorClass="text-vert-energie"
          animate={inView}
          liveDot
        />
        <StatColumn
          value={stats.totalArtists}
          label="artistes inscrits"
          colorClass="text-or-solaire"
          animate={inView}
        />
        <StatColumn
          value={stats.royaltiesPaidGnf}
          label="GNF versés aux artistes"
          colorClass="text-texte-principal"
          animate={inView}
        />
      </div>
    </div>
  );
}
