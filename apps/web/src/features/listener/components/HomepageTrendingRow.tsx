"use client";

import { useEffect, useMemo, useState } from "react";
import type { TrendingTrack, TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";
import { formatCount } from "@/lib/utils";
import { CARD_GRADIENTS } from "@/lib/constants";
import { CoverImage } from "@/components/CoverImage";
import { OVERLAY } from "@/lib/design/overlayTokens";

function toTrackWithMeta(t: TrendingTrack): TrackWithMeta {
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
    published_at: null,
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
  tracks: TrendingTrack[];
}

export function HomepageTrendingSection({ tracks }: Props) {
  const { loadQueueAndPlay, currentTrack, isPlaying } = usePlayer();
  const [playError, setPlayError] = useState<string | null>(null);
  const tracksWithMeta = useMemo(() => tracks.map(toTrackWithMeta), [tracks]);

  // Réinitialise l'erreur à chaque montage — évite qu'elle persiste via le router cache
  useEffect(() => { setPlayError(null); }, []);

  async function handlePlay(track: TrendingTrack) {
    const index = tracks.findIndex((t) => t.track_id === track.track_id);
    setPlayError(null);
    try {
      await loadQueueAndPlay(tracksWithMeta, index >= 0 ? index : 0);
    } catch {
      setPlayError("Impossible de lancer la lecture. Réessayez.");
    }
  }

  return (
    <div className="px-6 space-y-0.5">
      {playError && (
        <p className="text-xs mb-2" role="alert" style={{ color: "var(--color-danger)" }}>
          {playError}
        </p>
      )}
      {tracks.map((track, i) => {
        const isTop = i < 3;
        const isActive = currentTrack?.id === track.track_id;
        const grad = CARD_GRADIENTS[i % CARD_GRADIENTS.length]!;
        return (
          <button
            key={track.track_id}
            onClick={() => void handlePlay(track)}
            className="flex items-center gap-3 py-3 rounded-xl px-3 w-full text-left group cursor-pointer transition-colors motion-reduce:transition-none"
            style={{ borderBottom: "1px solid var(--color-noir-profond)" }}
            aria-label={`Lire ${track.title}${track.artist_name ? ` — ${track.artist_name}` : ""}`}
          >
            {/* Rank */}
            <div className="w-6 flex-shrink-0 text-right">
              {isTop ? (
                <span
                  className="text-sm font-black"
                  style={{ color: i === 0 ? "var(--color-vert-energie)" : i === 1 ? "var(--color-or-solaire)" : "var(--color-accent-orange)" }}
                >
                  {i + 1}
                </span>
              ) : (
                <span className="text-xs font-bold" style={{ color: "var(--color-texte-desactive)" }}>{i + 1}</span>
              )}
            </div>

            {/* Art */}
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 relative overflow-hidden"
              style={{ border: `1px solid ${grad.borderFaded}` }}
            >
              <CoverImage
                coverPath={track.cover_path}
                alt={track.title}
                artistName={track.artist_name ?? track.title}
                gradientSeed={i}
                priority={i < 3}
                imgSizes="40px"
              />
              {isActive && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: OVERLAY.noir45 }}
                >
                  {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--color-vert-energie)">
                      <rect x="2" y="2" width="4" height="12" rx="1" />
                      <rect x="10" y="2" width="4" height="12" rx="1" />
                    </svg>
                  ) : (
                    <svg width={10} height={12} viewBox="0 0 10 12" fill="var(--color-vert-energie)">
                      <path d="M0 0L10 6L0 12V0Z" />
                    </svg>
                  )}
                </div>
              )}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                style={{ background: OVERLAY.noir60 }}
              >
                <svg width={10} height={12} viewBox="0 0 10 12" fill="var(--color-vert-energie)">
                  <path d="M0 0L10 6L0 12V0Z" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: isActive ? "var(--color-vert-energie)" : "var(--color-texte-principal)" }}>
                {track.title}
              </p>
              {track.artist_name && (
                <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-texte-secondaire)" }}>
                  {track.artist_name}
                </p>
              )}
            </div>

            {/* Streams */}
            <div className="flex-shrink-0 text-right">
              <p className="text-xs font-bold tabular-nums" style={{ color: isTop ? "var(--color-vert-energie)" : "var(--color-texte-desactive)" }}>
                {formatCount(track.listen_count)}
              </p>
              <p className="text-[9px]" style={{ color: "var(--color-bordure)" }}>écoutes</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
