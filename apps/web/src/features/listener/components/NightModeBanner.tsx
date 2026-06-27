"use client";

import Link from "next/link";
import { useDayMode } from "../hooks/useDayMode";

export function NightModeBanner() {
  const { mode, musicMood } = useDayMode();

  if (mode !== "night") return null;

  return (
    <div className="night-mode-banner">
      <span className="night-emoji" aria-hidden="true">
        🌙
      </span>
      <div className="night-content">
        <p className="night-title">Mode nuit activé</p>
        <p className="night-mood">{musicMood}</p>
      </div>
      <Link href="/listen?category=all" className="night-cta">
        Playlist nuit →
      </Link>
    </div>
  );
}
