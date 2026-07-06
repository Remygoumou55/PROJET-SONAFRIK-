"use client";

import { useState } from "react";
import Link from "next/link";
import type { AlbumWithMeta, TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";
import { OVERLAY, LISTENER_ACTIVE_ROW_STYLE, LISTENER_INACTIVE_ROW_STYLE } from "@/lib/design/overlayTokens";
import { CoverImage } from "@/components/CoverImage";

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
          style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-center py-8" role="alert" style={{ color: "var(--color-danger)" }}>
        {error}
      </p>
    );
  }

  if (tracks.length === 0 && albums.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-4xl mb-4">❤️</p>
        <p className="font-semibold mb-1" style={{ color: "var(--color-texte-principal)" }}>
          Vous n&apos;avez pas encore de favoris
        </p>
        <p className="text-sm mb-5" style={{ color: "var(--color-texte-secondaire)" }}>
          Ajoutez des morceaux et albums en favoris pour les retrouver ici.
        </p>
        <Link
          href="/search"
          className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
        >
          Explorer la musique
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {playError && (
        <p className="text-sm" role="alert" style={{ color: "var(--color-danger)" }}>
          {playError}
        </p>
      )}

      {tracks.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold tracking-widest mb-3" style={{ color: "var(--color-texte-secondaire)" }}>
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
                  style={isActive ? LISTENER_ACTIVE_ROW_STYLE : LISTENER_INACTIVE_ROW_STYLE}
                >
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 relative overflow-hidden">
                    <CoverImage coverPath={track.cover_url ?? null} alt={track.title} imgSizes="40px" />
                    {isActive && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: OVERLAY.noir50 }}
                      >
                        {isPlaying ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--color-vert-energie)">
                            <rect x="2" y="2" width="4" height="12" rx="1" />
                            <rect x="10" y="2" width="4" height="12" rx="1" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--color-vert-energie)">
                            <path d="M4 2l10 6-10 6V2z" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: isActive ? "var(--color-vert-energie)" : "var(--color-texte-principal)" }}
                    >
                      {track.title}
                    </p>
                    {track.artist_name && (
                      <p className="text-xs truncate" style={{ color: "var(--color-texte-secondaire)" }}>
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
          <h2 className="text-xs font-semibold tracking-widest mb-3" style={{ color: "var(--color-texte-secondaire)" }}>
            ALBUMS ({albums.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {albums.map((album) => (
              <div
                key={album.id}
                className="rounded-xl p-3"
                style={{ backgroundColor: "var(--color-card)" }}
              >
                <div className="w-full aspect-square rounded-lg mb-2 relative overflow-hidden">
                  <CoverImage coverPath={album.cover_url ?? null} alt={album.title} imgSizes="50vw" />
                </div>
                <p className="text-sm font-semibold truncate" style={{ color: "var(--color-texte-principal)" }}>
                  {album.title}
                </p>
                {album.artist_name && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-texte-secondaire)" }}>
                    {album.artist_name}
                  </p>
                )}
                {album.track_count !== undefined && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-texte-desactive)" }}>
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
