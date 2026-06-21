"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiscoveryTrack, TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";
import { formatCount } from "@/lib/utils";
import { CARD_GRADIENTS } from "@/lib/constants";
import { CoverImage } from "@/components/CoverImage";

function toTrackWithMeta(t: DiscoveryTrack): TrackWithMeta {
  return {
    id: t.track_id,
    creator_id: t.creator_id,
    album_id: t.album_id,
    title: t.title,
    slug: t.slug,
    track_number: 0,
    isrc: null,
    duration_seconds: t.duration_seconds,
    explicit: false,
    language: "fr",
    bpm: null,
    musical_key: null,
    publication_status: "published",
    rejection_reason: null,
    submitted_at: null,
    published_at: t.published_at,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    artist_name: t.artist_name ?? undefined,
    album_title: t.album_title ?? undefined,
    cover_url: t.cover_path ?? null,
  };
}

interface Props {
  tracks: DiscoveryTrack[];
}

export function HomepageDiscoverySection({ tracks }: Props) {
  const { loadQueueAndPlay, currentTrack, isPlaying } = usePlayer();
  const [playError, setPlayError] = useState<string | null>(null);
  const tracksWithMeta = useMemo(() => tracks.map(toTrackWithMeta), [tracks]);

  // Réinitialise l'erreur à chaque montage — évite qu'elle persiste via le router cache
  useEffect(() => { setPlayError(null); }, []);

  async function handlePlay(track: DiscoveryTrack) {
    const index = tracks.findIndex((t) => t.track_id === track.track_id);
    setPlayError(null);
    try {
      await loadQueueAndPlay(tracksWithMeta, index >= 0 ? index : 0);
    } catch {
      setPlayError("Impossible de lancer la lecture. Réessayez.");
    }
  }

  return (
    <>
      {playError && (
        <p className="text-xs px-6 mb-2" role="alert" style={{ color: "var(--color-danger)" }}>
          {playError}
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: "none" }}>
        {tracks.map((track, i) => {
          const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length]!;
          const isActive = currentTrack?.id === track.track_id;
          return (
            <button
              key={track.track_id}
              onClick={() => void handlePlay(track)}
              className="flex-shrink-0 w-32 group cursor-pointer text-left"
              aria-label={`Lire ${track.title}${track.artist_name ? ` — ${track.artist_name}` : ""}`}
            >
              <div
                className="aspect-square rounded-xl mb-2 relative overflow-hidden"
                style={{ border: `1px solid ${isActive ? gradient.from : `${gradient.from}25`}` }}
              >
                <CoverImage coverPath={track.cover_path} alt={track.title} gradientSeed={i} priority={i === 0} imgSizes="128px" />
                {isActive && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.4)" }}
                  >
                    {isPlaying ? (
                      <svg width="18" height="18" viewBox="0 0 16 16" fill={gradient.from}>
                        <rect x="2" y="2" width="4" height="12" rx="1" />
                        <rect x="10" y="2" width="4" height="12" rx="1" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 16 16" fill={gradient.from}>
                        <path d="M4 2l8 6-8 6V2Z" />
                      </svg>
                    )}
                  </div>
                )}
                {/* Like count */}
                {track.like_count > 0 && (
                  <div
                    className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                  >
                    <svg width={8} height={8} viewBox="0 0 24 24" fill="var(--color-vert-energie)">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-[9px] font-bold" style={{ color: "var(--color-vert-energie)" }}>{formatCount(track.like_count)}</span>
                  </div>
                )}
                {/* Play/pause hover overlay */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 motion-reduce:transition-none flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.55)" }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "var(--color-vert-energie)", boxShadow: "0 0 14px rgba(0,210,106,0.7)" }}>
                    {isActive && isPlaying ? (
                      <svg width={12} height={12} viewBox="0 0 16 16" fill="#000">
                        <rect x="2" y="1" width="4" height="14" rx="1" />
                        <rect x="10" y="1" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg width={12} height={12} viewBox="0 0 12 14" fill="#000"><path d="M0 0L12 7L0 14V0Z" /></svg>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold truncate" style={{ color: isActive ? "var(--color-vert-energie)" : "var(--color-texte-principal)" }}>{track.title}</p>
              {track.artist_name && <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--color-texte-secondaire)" }}>{track.artist_name}</p>}
            </button>
          );
        })}
      </div>
    </>
  );
}
