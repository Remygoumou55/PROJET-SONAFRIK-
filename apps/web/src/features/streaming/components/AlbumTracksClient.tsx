"use client";

import { useCallback, useState } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";
import { CoverImage } from "@/components/CoverImage";
import { formatTime } from "@/lib/formatters";

function TrackRow({
  track,
  index,
  isActive,
  isPlaying,
  onPlay,
}: {
  track: TrackWithMeta;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: (track: TrackWithMeta) => void;
}) {
  return (
    <button
      onClick={() => onPlay(track)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
      style={{
        backgroundColor: isActive ? "#00D26A11" : "transparent",
        border: `1px solid ${isActive ? "#00D26A33" : "transparent"}`,
      }}
    >
      <div className="w-8 text-center flex-shrink-0">
        {isActive ? (
          isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="#00D26A" className="mx-auto">
              <rect x="1" y="1" width="4" height="12" rx="1" />
              <rect x="9" y="1" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="#00D26A" className="mx-auto">
              <path d="M3 1l10 6-10 6V1z" />
            </svg>
          )
        ) : (
          <span className="text-sm" style={{ color: "#555555" }}>{index + 1}</span>
        )}
      </div>
      <div className="w-10 h-10 rounded-lg flex-shrink-0 relative overflow-hidden">
        <CoverImage coverPath={track.cover_url ?? null} alt={track.title} gradientSeed={index} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: isActive ? "#00D26A" : "#FFFFFF" }}
        >
          {track.title}
        </p>
        {track.artist_name && (
          <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
            {track.artist_name}
          </p>
        )}
      </div>
      {track.duration_seconds ? (
        <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: "#555555" }}>
          {formatTime(track.duration_seconds)}
        </span>
      ) : null}
    </button>
  );
}

export function AlbumTracksClient({ tracks }: { tracks: TrackWithMeta[] }) {
  const { loadQueueAndPlay, currentTrack, isPlaying } = usePlayer();
  const [error, setError] = useState<string | null>(null);

  const handlePlay = useCallback(
    async (track: TrackWithMeta) => {
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
    <div className="space-y-3">
      {/* Bouton Play All */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handlePlayAll}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 1l11 6-11 6V1z" />
          </svg>
          Tout écouter
        </button>
      </div>

      {error && (
        <p className="text-sm px-3 mb-2" role="alert" style={{ color: "#FF4D4F" }}>
          {error}
        </p>
      )}

      <div className="space-y-1">
        {tracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i}
            isActive={currentTrack?.id === track.id}
            isPlaying={isPlaying}
            onPlay={handlePlay}
          />
        ))}
      </div>
    </div>
  );
}
