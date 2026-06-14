"use client";

import { useState } from "react";
import type { TrendingTrack, TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";

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
    created_at: "",
    updated_at: "",
    deleted_at: null,
    artist_name: t.artist_name ?? undefined,
    album_title: t.album_title ?? undefined,
    cover_url: null,
  };
}

const CARD_GRADIENTS = [
  { from: "#00D26A", to: "#009449" },
  { from: "#FFC20E", to: "#E5A800" },
  { from: "#F97316", to: "#C2410C" },
  { from: "#A855F7", to: "#7C3AED" },
  { from: "#3B82F6", to: "#1D4ED8" },
  { from: "#EC4899", to: "#BE185D" },
  { from: "#14B8A6", to: "#0F766E" },
  { from: "#EF4444", to: "#B91C1C" },
] as const;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

interface Props {
  tracks: TrendingTrack[];
}

export function HomepageTrendingSection({ tracks }: Props) {
  const { loadAndPlay, currentTrack, isPlaying } = usePlayer();
  const [playError, setPlayError] = useState<string | null>(null);

  async function handlePlay(track: TrendingTrack) {
    setPlayError(null);
    try {
      await loadAndPlay(toTrackWithMeta(track));
    } catch {
      setPlayError("Impossible de lancer la lecture. Réessayez.");
    }
  }

  return (
    <div className="px-6 space-y-0.5">
      {playError && (
        <p className="text-xs mb-2" role="alert" style={{ color: "#FF4D4F" }}>
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
            className="flex items-center gap-3 py-3 rounded-xl px-3 w-full text-left group cursor-pointer transition-colors"
            style={{ borderBottom: "1px solid #141414" }}
            aria-label={`Lire ${track.title}${track.artist_name ? ` — ${track.artist_name}` : ""}`}
          >
            {/* Rank */}
            <div className="w-6 flex-shrink-0 text-right">
              {isTop ? (
                <span
                  className="text-sm font-black"
                  style={{ color: i === 0 ? "#00D26A" : i === 1 ? "#FFC20E" : "#F97316" }}
                >
                  {i + 1}
                </span>
              ) : (
                <span className="text-xs font-bold" style={{ color: "#444444" }}>{i + 1}</span>
              )}
            </div>

            {/* Art placeholder */}
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${grad.from}28, ${grad.to}14)`,
                border: `1px solid ${grad.from}25`,
              }}
            >
              {isActive && isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill={grad.from}>
                  <rect x="2" y="2" width="4" height="12" rx="1" />
                  <rect x="10" y="2" width="4" height="12" rx="1" />
                </svg>
              ) : (
                <svg width={10} height={12} viewBox="0 0 10 12" fill={isActive ? grad.from : "#555"}>
                  <path d="M0 0L10 6L0 12V0Z" />
                </svg>
              )}
              {/* Play overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                style={{ background: "rgba(0,0,0,0.6)" }}
              >
                <svg width={10} height={12} viewBox="0 0 10 12" fill="#00D26A">
                  <path d="M0 0L10 6L0 12V0Z" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: isActive ? "#00D26A" : "#FFFFFF" }}>
                {track.title}
              </p>
              {track.artist_name && (
                <p className="text-xs truncate mt-0.5" style={{ color: "#666666" }}>
                  {track.artist_name}
                </p>
              )}
            </div>

            {/* Streams */}
            <div className="flex-shrink-0 text-right">
              <p className="text-xs font-bold tabular-nums" style={{ color: isTop ? "#00D26A" : "#444444" }}>
                {formatCount(track.listen_count)}
              </p>
              <p className="text-[9px]" style={{ color: "#333333" }}>écoutes</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
