"use client";

import { useEffect, useMemo, useState } from "react";
import type { TrackWithMeta, TrendingTrack } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";
import { TrackRow } from "./TrackRow";

function toTrackWithMeta(track: TrendingTrack): TrackWithMeta {
  return {
    id: track.track_id,
    creator_id: track.creator_id,
    album_id: track.album_id,
    title: track.title,
    slug: track.slug,
    track_number: 0,
    isrc: null,
    duration_seconds: track.duration_seconds,
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
    artist_name: track.artist_name ?? undefined,
    album_title: track.album_title ?? undefined,
    cover_url: track.cover_path ?? null,
  };
}

interface TopGuineaSectionProps {
  tracks: TrendingTrack[];
}

export function TopGuineaSection({ tracks }: TopGuineaSectionProps) {
  const { loadQueueAndPlay, currentTrack, isPlaying } = usePlayer();
  const [playError, setPlayError] = useState<string | null>(null);
  const tracksWithMeta = useMemo(() => tracks.map(toTrackWithMeta), [tracks]);

  useEffect(() => {
    setPlayError(null);
  }, []);

  async function handlePlay(index: number) {
    setPlayError(null);
    try {
      await loadQueueAndPlay(tracksWithMeta, index);
    } catch {
      setPlayError("Impossible de lancer la lecture. Réessayez.");
    }
  }

  return (
    <section className="listen-page-section mt-8" aria-labelledby="listen-top-guinea-title">
      <div className="listen-section-header">
        <h2 id="listen-top-guinea-title" className="listen-section-title">
          Top Guinée cette semaine
        </h2>
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{
            background: "var(--overlay-vert-nav)",
            color: "var(--color-vert-energie)",
            border: "1px solid var(--overlay-vert-soft)",
          }}
        >
          7 derniers jours
        </span>
      </div>
      {playError ? (
        <p className="px-6 text-xs mb-2" role="alert" style={{ color: "var(--color-danger)" }}>
          {playError}
        </p>
      ) : null}
      <div>
        {tracks.map((track, index) => {
          const isActive = currentTrack?.id === track.track_id;
          return (
            <TrackRow
              key={track.track_id}
              position={index + 1}
              title={track.title}
              artistName={track.artist_name}
              coverPath={track.cover_path}
              durationSeconds={track.duration_seconds}
              streamCount={track.listen_count}
              gradientSeed={index}
              isActive={isActive && isPlaying}
              onPlay={() => void handlePlay(index)}
            />
          );
        })}
      </div>
    </section>
  );
}
