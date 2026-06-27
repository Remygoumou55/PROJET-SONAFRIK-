"use client";

import { CoverImage } from "@/components/CoverImage";
import { formatTrackDuration } from "../lib/formatTrackDuration";

interface TrackCardProps {
  title: string;
  artistName: string | null;
  coverPath?: string | null;
  durationSeconds: number | null;
  gradientSeed?: number;
  isActive?: boolean;
  onPlay?: () => void;
}

export function TrackCard({
  title,
  artistName,
  coverPath,
  durationSeconds,
  gradientSeed = 0,
  isActive = false,
  onPlay,
}: TrackCardProps) {
  return (
    <button
      type="button"
      className="listen-track-card"
      onClick={onPlay}
      aria-label={`Lire ${title}${artistName ? ` — ${artistName}` : ""}`}
    >
      <div className="listen-track-card-cover">
        <CoverImage
          coverPath={coverPath}
          alt={title}
          gradientSeed={gradientSeed}
          imgSizes="160px"
        />
        <div className="listen-track-card-play-overlay" aria-hidden="true">
          <span className="listen-track-card-play-btn">
            {isActive ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="2" y="1" width="4" height="14" rx="1" />
                <rect x="10" y="1" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="16" viewBox="0 0 10 12" fill="currentColor">
                <path d="M0 0L10 6L0 12V0Z" />
              </svg>
            )}
          </span>
        </div>
      </div>
      <div className="listen-track-card-info">
        <p className="listen-track-card-title">{title}</p>
        {artistName ? <p className="listen-track-card-artist">{artistName}</p> : null}
        <p className="listen-track-card-duration">{formatTrackDuration(durationSeconds)}</p>
      </div>
    </button>
  );
}
