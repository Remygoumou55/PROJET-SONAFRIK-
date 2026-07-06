"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { usePlayer } from "../hooks/usePlayer";
import { useTrackListenCounts } from "../hooks/useTrackListenCounts";
import { usePlayerPosition } from "../lib/playerContext";
import { PlayerProgressBar, formatTime } from "./PlayerProgressBar";

const QueuePanel = dynamic(
  () => import("./QueuePanel").then((m) => ({ default: m.QueuePanel })),
  { ssr: false },
);

const LyricsPanel = dynamic(
  () => import("./LyricsPanel").then((m) => ({ default: m.LyricsPanel })),
  { ssr: false },
);

function formatListenCount(value: number): string {
  return value.toLocaleString("fr-FR");
}

export function TrackListenStats({ trackId }: { trackId: string }) {
  const counts = useTrackListenCounts(trackId);

  if (!counts || counts.all_time <= 0) return null;

  const periodParts: string[] = [];
  if (counts.window_7d > 0) {
    periodParts.push(`${formatListenCount(counts.window_7d)} sur 7 j`);
  }
  if (counts.window_30d > 0 && counts.window_30d !== counts.window_7d) {
    periodParts.push(`${formatListenCount(counts.window_30d)} sur 30 j`);
  }

  return (
    <p className="fpp-listen-stats" aria-label="Statistiques d'écoutes valides">
      <span className="fpp-listen-stats-total">
        {formatListenCount(counts.all_time)}{" "}
        {counts.all_time > 1 ? "écoutes valides" : "écoute valide"}
      </span>
      {periodParts.length > 0 ? (
        <span className="fpp-listen-stats-period">{periodParts.join(" · ")}</span>
      ) : null}
    </p>
  );
}

export function FullPlayerProgress() {
  const { duration, seek } = usePlayer();
  const currentPosition = usePlayerPosition();

  return (
    <div className="fpp-progress-section">
      <div
        className="fpp-progress-track"
        role="slider"
        aria-label="Progression du morceau"
        aria-valuenow={Math.floor(currentPosition)}
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration)}
        tabIndex={0}
      >
        <PlayerProgressBar currentPosition={currentPosition} duration={duration} onSeek={seek} />
      </div>
      <div className="fpp-time-row">
        <span>{formatTime(currentPosition)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export function QueueOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fpp-queue-overlay" onClick={onClose} role="presentation">
      <div
        className="fpp-queue-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="File d'attente"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fpp-queue-header">
          <h3>File d&apos;attente</h3>
          <button type="button" className="fpp-close" onClick={onClose} aria-label="Fermer la file">
            ✕
          </button>
        </div>
        <QueuePanel />
      </div>
    </div>
  );
}

export function LyricsOverlay({
  isOpen,
  onClose,
  trackId,
}: {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
}) {
  const currentPosition = usePlayerPosition();

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fpp-queue-overlay" onClick={onClose} role="presentation">
      <div
        className="fpp-lyrics-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Paroles synchronisées"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fpp-queue-header">
          <h3>Paroles</h3>
          <button type="button" className="fpp-close" onClick={onClose} aria-label="Fermer les paroles">
            ✕
          </button>
        </div>
        <LyricsPanel trackId={trackId} currentTime={currentPosition} />
      </div>
    </div>
  );
}
