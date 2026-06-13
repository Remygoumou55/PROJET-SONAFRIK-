"use client";

import { useState } from "react";
import type { AlbumWithMeta, TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";

interface FavoritesListProps {
  tracks: TrackWithMeta[];
  albums: AlbumWithMeta[];
  isLoading: boolean;
  error: string | null;
}

export function FavoritesList({ tracks, albums, isLoading, error }: FavoritesListProps) {
  const { loadAndPlay, currentTrack, isPlaying } = usePlayer();
  const [playError, setPlayError] = useState<string | null>(null);

  async function handlePlay(track: TrackWithMeta) {
    setPlayError(null);
    try {
      await loadAndPlay(track);
    } catch (err) {
      setPlayError(err instanceof Error ? err.message : "Impossible de lancer la lecture.");
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: "#00D26A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-center py-8" role="alert" style={{ color: "#FF4D4F" }}>
        {error}
      </p>
    );
  }

  if (tracks.length === 0 && albums.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-4xl mb-4">❤️</p>
        <p className="font-semibold mb-1" style={{ color: "#FFFFFF" }}>
          Aucun favori
        </p>
        <p className="text-sm" style={{ color: "#A0A0A0" }}>
          Ajoutez des morceaux et albums en favoris pour les retrouver ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {playError && (
        <p className="text-sm" role="alert" style={{ color: "#FF4D4F" }}>
          {playError}
        </p>
      )}

      {tracks.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold tracking-widest mb-3" style={{ color: "#A0A0A0" }}>
            MORCEAUX ({tracks.length})
          </h2>
          <div className="space-y-1">
            {tracks.map((track) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => handlePlay(track)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors"
                  style={{
                    backgroundColor: isActive ? "#00D26A11" : "transparent",
                    border: isActive ? "1px solid #00D26A33" : "1px solid transparent",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: "#1F1F1F" }}
                  >
                    {isActive && isPlaying ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="#00D26A">
                        <rect x="2" y="2" width="4" height="12" rx="1" />
                        <rect x="10" y="2" width="4" height="12" rx="1" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill={isActive ? "#00D26A" : "#A0A0A0"}
                      >
                        <path d="M4 2l10 6-10 6V2z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
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
                </button>
              );
            })}
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold tracking-widest mb-3" style={{ color: "#A0A0A0" }}>
            ALBUMS ({albums.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {albums.map((album) => (
              <div
                key={album.id}
                className="rounded-xl p-3"
                style={{ backgroundColor: "#1F1F1F" }}
              >
                <div
                  className="w-full aspect-square rounded-lg mb-2"
                  style={{ backgroundColor: "#2A2A2A" }}
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold truncate" style={{ color: "#FFFFFF" }}>
                  {album.title}
                </p>
                {album.artist_name && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "#A0A0A0" }}>
                    {album.artist_name}
                  </p>
                )}
                {album.track_count !== undefined && (
                  <p className="text-xs mt-1" style={{ color: "#555555" }}>
                    {album.track_count} titre{album.track_count !== 1 ? "s" : ""}
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
