"use client";

import { CoverImage } from "@/components/CoverImage";
import { formatTrackDuration } from "../lib/formatTrackDuration";

interface TrackRowProps {
  position: number;
  title: string;
  artistName: string | null;
  coverPath?: string | null;
  durationSeconds: number | null;
  streamCount?: number;
  gradientSeed?: number;
  isActive?: boolean;
  onPlay?: () => void;
}

export function TrackRow({
  position,
  title,
  artistName,
  coverPath,
  durationSeconds,
  streamCount,
  gradientSeed = 0,
  isActive = false,
  onPlay,
}: TrackRowProps) {
  const isTop = position <= 3;

  return (
    <button
      type="button"
      className="listen-track-row"
      onClick={onPlay}
      aria-label={`Lire ${title}${artistName ? ` — ${artistName}` : ""}`}
    >
      <span className={`listen-track-row-pos${isTop ? " listen-track-row-pos--top" : ""}`}>
        {position}
      </span>
      <div className="listen-track-row-cover">
        <CoverImage coverPath={coverPath} alt={title} gradientSeed={gradientSeed} imgSizes="40px" />
      </div>
      <div className="listen-track-row-info">
        <p className={`listen-track-row-title${isActive ? " listen-track-row-title--active" : ""}`}>
          {title}
        </p>
        {artistName ? <p className="listen-track-row-artist">{artistName}</p> : null}
      </div>
      <div className="listen-track-row-meta">
        {streamCount != null && streamCount > 0 ? (
          <span>{streamCount.toLocaleString("fr-FR")} écoutes</span>
        ) : (
          <span>{formatTrackDuration(durationSeconds)}</span>
        )}
      </div>
    </button>
  );
}
