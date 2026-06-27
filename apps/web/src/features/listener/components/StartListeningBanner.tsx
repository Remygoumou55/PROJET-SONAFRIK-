"use client";

import Link from "next/link";
import { usePlayerContext } from "../lib/playerContext";

export function StartListeningBanner() {
  const { currentTrack } = usePlayerContext();

  if (currentTrack) return null;

  return (
    <section className="mt-8 px-6">
      <div className="start-listening-banner">
        <div className="sl-icon-wrap" aria-hidden="true">
          <span className="sl-icon">▶</span>
        </div>
        <div className="sl-content">
          <p className="sl-title">Commencer l&apos;écoute</p>
          <p className="sl-sub">Recherchez un morceau pour démarrer</p>
        </div>
        <Link href="/search" className="sl-cta">
          Explorer
        </Link>
      </div>
    </section>
  );
}
