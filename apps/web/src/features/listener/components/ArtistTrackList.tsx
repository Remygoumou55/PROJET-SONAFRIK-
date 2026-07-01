"use client";

import { memo, useCallback, useState } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";
import { CoverImage } from "@/components/CoverImage";
import { formatTime } from "@/lib/formatters";
import { AddToPlaylistButton } from "./AddToPlaylistButton";

type TrackWithCount = TrackWithMeta & { play_count?: number };

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const ArtistTrackRow = memo(function ArtistTrackRow({
  track,
  index,
  isActive,
  isPlaying,
  showPlayCount,
  onPlay,
}: {
  track: TrackWithCount;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  showPlayCount: boolean;
  onPlay: (track: TrackWithCount) => void;
}) {
  return (
    <div className={`ap-track-row${isActive ? " ap-track-row--active" : ""}`}>
      <button
        onClick={() => onPlay(track)}
        className="ap-track-play-area"
        aria-label={`Lire ${track.title}`}
      >
        <div className="ap-track-index">
          {isActive ? (
            isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--color-vert-energie)" className="mx-auto">
                <rect x="1" y="1" width="4" height="12" rx="1" />
                <rect x="9" y="1" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--color-vert-energie)" className="mx-auto">
                <path d="M3 1l10 6-10 6V1z" />
              </svg>
            )
          ) : (
            <span className="ap-track-num">{index + 1}</span>
          )}
        </div>

        <div className="ap-track-cover">
          <CoverImage coverPath={track.cover_url ?? null} alt={track.title} gradientSeed={index} imgSizes="44px" />
        </div>

        <div className="ap-track-meta">
          <p className={`ap-track-title${isActive ? " ap-track-title--active" : ""}`}>
            {track.title}
          </p>
          {showPlayCount && typeof track.play_count === "number" && (
            <p className="ap-track-plays">
              {fmtCount(track.play_count)} écoute{track.play_count !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </button>

      <div className="ap-track-right">
        {track.duration_seconds ? (
          <span className="ap-track-duration">{formatTime(track.duration_seconds)}</span>
        ) : null}
        <AddToPlaylistButton trackId={track.id} />
      </div>
    </div>
  );
});

export function ArtistTrackList({
  tracks,
  showPlayCount = false,
}: {
  tracks: TrackWithCount[];
  showPlayCount?: boolean;
}) {
  const { loadQueueAndPlay, currentTrack, isPlaying } = usePlayer();
  const [error, setError] = useState<string | null>(null);

  const handlePlay = useCallback(
    async (track: TrackWithCount) => {
      const index = tracks.findIndex((t) => t.id === track.id);
      setError(null);
      try {
        await loadQueueAndPlay(tracks, index >= 0 ? index : 0);
      } catch {
        setError("Impossible de lire ce morceau. Réessayez.");
      }
    },
    [tracks, loadQueueAndPlay],
  );

  const handlePlayAll = useCallback(async () => {
    setError(null);
    try {
      await loadQueueAndPlay(tracks, 0);
    } catch {
      setError("Impossible de démarrer la lecture. Réessayez.");
    }
  }, [tracks, loadQueueAndPlay]);

  return (
    <div className="ap-track-list">
      <div className="ap-track-list-header">
        <button onClick={handlePlayAll} className="ap-play-all-btn" aria-label="Tout écouter">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <path d="M2 1l11 6-11 6V1z" />
          </svg>
          Tout écouter
        </button>
      </div>

      {error && (
        <p className="ap-track-error" role="alert">{error}</p>
      )}

      <div className="ap-track-rows">
        {tracks.map((track, i) => (
          <ArtistTrackRow
            key={track.id}
            track={track}
            index={i}
            isActive={currentTrack?.id === track.id}
            isPlaying={isPlaying}
            showPlayCount={showPlayCount}
            onPlay={handlePlay}
          />
        ))}
      </div>
    </div>
  );
}
