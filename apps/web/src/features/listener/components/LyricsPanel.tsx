"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTrackLyrics } from "../hooks/useTrackLyrics";

interface LyricsPanelProps {
  trackId: string;
  currentTime: number;
}

export function LyricsPanel({ trackId, currentTime }: LyricsPanelProps) {
  const { lines, isLoading, hasLyrics } = useTrackLyrics(trackId);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = lines.reduce((acc, line, index) => {
    return line.time <= currentTime ? index : acc;
  }, -1);

  useEffect(() => {
    if (activeIndex < 0 || !containerRef.current) return;
    const activeLine = containerRef.current.children[activeIndex] as HTMLElement | undefined;
    activeLine?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="lyrics-loading" aria-busy="true" aria-label="Chargement des paroles">
        <div className="lyrics-loading-dot" />
        <div className="lyrics-loading-dot" />
        <div className="lyrics-loading-dot" />
      </div>
    );
  }

  if (!hasLyrics) {
    return (
      <div className="lyrics-empty">
        <span className="lyrics-empty-icon" aria-hidden="true">
          📝
        </span>
        <p className="lyrics-empty-title">Paroles non disponibles</p>
        <p className="lyrics-empty-sub">
          L&apos;artiste n&apos;a pas encore soumis les paroles de ce morceau.
        </p>
        <Link href="/creator/catalog/tracks" className="lyrics-submit-link">
          Artiste ? Soumettez vos paroles →
        </Link>
      </div>
    );
  }

  return (
    <div className="lyrics-panel" ref={containerRef} role="region" aria-label="Paroles synchronisées">
      {lines.map((line, index) => (
        <p
          key={`${line.time}-${index}`}
          className={`lyrics-line${index === activeIndex ? " active" : ""}${index < activeIndex ? " past" : ""}`}
        >
          {line.text}
        </p>
      ))}
    </div>
  );
}
