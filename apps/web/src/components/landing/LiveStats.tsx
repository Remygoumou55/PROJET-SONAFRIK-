"use client";

import { useCallback, useEffect, useState } from "react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useInView } from "@/hooks/useInView";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import type { LandingPublicStats } from "@/lib/landing/constants";

const POLL_MS = 30_000;

function StatColumn({
  value,
  label,
  color,
  animate,
  liveDot = false,
}: {
  value: number;
  label: string;
  color: string;
  animate: boolean;
  liveDot?: boolean;
}) {
  const display = useAnimatedNumber(value, animate);

  return (
    <div className="flex flex-1 flex-col items-center gap-1 text-center">
      <div className="flex items-center gap-2">
        {liveDot ? <span className="live-dot" aria-hidden="true" /> : null}
        <span style={{ fontSize: "28px", fontWeight: 700, color, lineHeight: 1 }}>
          {display.toLocaleString("fr-FR")}
        </span>
      </div>
      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{label}</span>
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

  useRealtimeChannel(
    "landing-live-streams",
    [{ event: "*", table: "stream_sessions", onEvent: () => void load() }],
    stats !== null,
  );

  if (!loaded) {
    return (
      <div
        ref={ref}
        style={{
          borderTop: "1px solid rgba(0,210,106,0.15)",
          borderBottom: "1px solid rgba(0,210,106,0.15)",
          backgroundColor: "rgba(0,210,106,0.06)",
          padding: "16px",
          marginBottom: "48px",
          minHeight: "72px",
        }}
        aria-hidden="true"
      />
    );
  }

  if (!stats) return null;

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Statistiques en direct"
      style={{
        borderTop: "1px solid rgba(0,210,106,0.15)",
        borderBottom: "1px solid rgba(0,210,106,0.15)",
        backgroundColor: "rgba(0,210,106,0.06)",
        padding: "16px",
        marginBottom: "48px",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
        <StatColumn
          value={stats.activeStreams}
          label="en train d'écouter"
          color="var(--color-vert-energie)"
          animate={inView}
          liveDot
        />
        <StatColumn
          value={stats.totalArtists}
          label="artistes inscrits"
          color="var(--color-or-solaire)"
          animate={inView}
        />
        <StatColumn
          value={stats.royaltiesPaidGnf}
          label="GNF versés aux artistes"
          color="var(--color-texte-principal)"
          animate={inView}
        />
      </div>
    </div>
  );
}
