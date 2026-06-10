"use client";

import { memo } from "react";
import type { SearchResult, TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";

interface SearchResultsProps {
  results: SearchResult | null;
  isSearching: boolean;
}

const TrackRow = memo(function TrackRow({
  track,
  onPlay,
}: {
  track: TrackWithMeta;
  onPlay: (track: TrackWithMeta) => void;
}) {
  return (
    <button
      className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors hover:bg-opacity-60"
      style={{ backgroundColor: "transparent" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#1F1F1F")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
      onClick={() => onPlay(track)}
    >
      <div
        className="w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: "#2A2A2A" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#00D26A">
          <path d="M4 2L14 8L4 14V2Z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
          {track.title}
        </p>
        {track.artist_name && (
          <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
            {track.artist_name}
          </p>
        )}
      </div>
      {track.duration_seconds && (
        <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: "#555555" }}>
          {Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, "0")}
        </span>
      )}
    </button>
  );
});

export function SearchResults({ results, isSearching }: SearchResultsProps) {
  const { loadAndPlay } = usePlayer();

  if (isSearching) {
    return (
      <div className="flex justify-center py-8">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: "#00D26A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!results) return null;

  if (results.total === 0) {
    return (
      <div className="py-8 text-center">
        <p style={{ color: "#A0A0A0" }}>Aucun résultat pour « {results.query} »</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.tracks.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#A0A0A0" }}>
            Morceaux
          </h3>
          <div className="space-y-1">
            {results.tracks.map((track) => (
              <TrackRow key={track.id} track={track} onPlay={loadAndPlay} />
            ))}
          </div>
        </section>
      )}
      {results.albums.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#A0A0A0" }}>
            Albums
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {results.albums.map((album) => (
              <div
                key={album.id}
                className="rounded-xl p-3 flex flex-col gap-2"
                style={{ backgroundColor: "#1F1F1F" }}
              >
                <div
                  className="aspect-square rounded-lg w-full"
                  style={{ backgroundColor: "#2A2A2A" }}
                />
                <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
                  {album.title}
                </p>
                {album.artist_name && (
                  <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
                    {album.artist_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
