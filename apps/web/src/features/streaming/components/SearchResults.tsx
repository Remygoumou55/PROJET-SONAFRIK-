"use client";

import { memo, useCallback, useState } from "react";
import Link from "next/link";
import type { AlbumWithMeta, ArtistResult, SearchResult, TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";
import { getInitials } from "@/lib/utils";
import { CoverImage } from "@/components/CoverImage";

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
      <div className="w-10 h-10 rounded-md flex-shrink-0 relative overflow-hidden">
        <CoverImage coverPath={track.cover_url ?? null} alt={track.title} />
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

const ArtistRow = memo(function ArtistRow({ artist }: { artist: ArtistResult }) {
  return (
    <Link
      href={`/listen/artist/${artist.creator_id}`}
      className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors"
      style={{ backgroundColor: "transparent" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#1F1F1F")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
    >
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: "#2A2A2A", color: "#00D26A" }}
      >
        {getInitials(artist.stage_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
          {artist.stage_name}
          {artist.verified && (
            <span className="ml-1.5 text-xs" style={{ color: "#FFC20E" }}>✓</span>
          )}
        </p>
        {artist.genres.length > 0 && (
          <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
            {artist.genres.slice(0, 2).join(" · ")}
          </p>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#555555", flexShrink: 0 }}>
        <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
});

export function SearchResults({ results, isSearching }: SearchResultsProps) {
  const { loadQueueAndPlay } = usePlayer();
  const [playError, setPlayError] = useState<string | null>(null);

  const handlePlay = useCallback(
    async (track: TrackWithMeta) => {
      if (!results) return;
      const index = results.tracks.findIndex((t) => t.id === track.id);
      setPlayError(null);
      try {
        await loadQueueAndPlay(results.tracks, index >= 0 ? index : 0);
      } catch {
        setPlayError("Impossible de lire ce morceau. Réessayez.");
      }
    },
    [results, loadQueueAndPlay],
  );

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
      {playError && (
        <p className="text-sm text-red-500 px-1" role="alert">{playError}</p>
      )}
      {results.artists.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#A0A0A0" }}>
            Artistes
          </h3>
          <div className="space-y-1">
            {results.artists.map((artist) => (
              <ArtistRow key={artist.creator_id} artist={artist} />
            ))}
          </div>
        </section>
      )}
      {results.tracks.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#A0A0A0" }}>
            Morceaux
          </h3>
          <div className="space-y-1">
            {results.tracks.map((track) => (
              <TrackRow key={track.id} track={track} onPlay={handlePlay} />
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
            {results.albums.map((album: AlbumWithMeta) => (
              <Link
                key={album.id}
                href={`/listen/album/${album.id}`}
                className="rounded-xl p-3 flex flex-col gap-2 transition-colors"
                style={{ backgroundColor: "#1F1F1F", display: "flex" }}
              >
                <div className="aspect-square rounded-lg w-full relative overflow-hidden">
                  <CoverImage coverPath={album.cover_url ?? null} alt={album.title} />
                </div>
                <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
                  {album.title}
                </p>
                {album.artist_name && (
                  <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
                    {album.artist_name}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
