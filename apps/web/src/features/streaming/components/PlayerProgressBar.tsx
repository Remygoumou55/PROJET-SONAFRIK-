"use client";

import { memo } from "react";

/**
 * Real Listen V7.2 — Barre de progression non-cliquable.
 * pointer-events: none empêche toute interaction utilisateur.
 * La progression est calculée et mise à jour côté serveur uniquement.
 */
export const PlayerProgressBar = memo(function PlayerProgressBar({
  currentPosition,
  duration,
}: {
  currentPosition: number;
  duration: number;
}) {
  const percentage = duration > 0 ? Math.min((currentPosition / duration) * 100, 100) : 0;

  return (
    <div
      className="h-1 w-full rounded-full overflow-hidden"
      style={{
        backgroundColor: "#333333",
        pointerEvents: "none",
        cursor: "default",
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{
          width: `${percentage}%`,
          backgroundColor: "#00D26A",
          pointerEvents: "none",
        }}
      />
    </div>
  );
});

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
