"use client";

import { useEffect, useMemo, useState } from "react";
import type { TrackWithMeta, TrendingTrack } from "@sonafrik/types";
import { filterValidTracks } from "@/lib/content-filter";
import { CoverImage } from "@/components/CoverImage";
import { formatTrackDuration } from "../lib/formatTrackDuration";
import { usePlayer } from "../hooks/usePlayer";

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

function getPositionLabel(position: number): string {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return String(position);
}

interface TopGuineaSectionProps {
  tracks: TrendingTrack[];
}

export function TopGuineaSection({ tracks }: TopGuineaSectionProps) {
  const { loadQueueAndPlay, currentTrack, isPlaying } = usePlayer();
  const [playError, setPlayError] = useState<string | null>(null);

  const validTracks = useMemo(() => filterValidTracks(tracks), [tracks]);
  const displayTracks = useMemo(() => validTracks.slice(0, 10), [validTracks]);
  const tracksWithMeta = useMemo(() => displayTracks.map(toTrackWithMeta), [displayTracks]);
  const maxStreams = useMemo(
    () => Math.max(...displayTracks.map((track) => track.listen_count), 1),
    [displayTracks],
  );

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

  if (displayTracks.length === 0) return null;

  return (
    <section className="top-guinea-section listen-page-section mt-8" aria-labelledby="listen-top-guinea-title">
      <div className="listen-section-header top-guinea-header">
        <div className="top-guinea-title-wrap">
          <span aria-hidden="true">🇬🇳</span>
          <h2 id="listen-top-guinea-title" className="listen-section-title">
            Top Guinée
          </h2>
          <span className="section-subtitle">cette semaine</span>
        </div>
        <span className="section-period">7 derniers jours</span>
      </div>

      {playError ? (
        <p className="px-6 text-xs mb-2" role="alert" style={{ color: "var(--color-danger)" }}>
          {playError}
        </p>
      ) : null}

      <div className="top-guinea-list">
        {displayTracks.map((track, index) => {
          const position = index + 1;
          const isTop3 = position <= 3;
          const isActive = currentTrack?.id === track.track_id;
          const relativeWidth = (track.listen_count / maxStreams) * 100;
          const artistName = track.artist_name ?? "Artiste";

          return (
            <button
              key={track.track_id}
              type="button"
              className={`top-track-row${isTop3 ? " top-track-row--podium" : ""}`}
              onClick={() => void handlePlay(index)}
              aria-label={`${position}. ${track.title} par ${artistName}`}
            >
              <div className={`top-pos${isTop3 ? ` top-pos--${position}` : ""}`}>
                {position <= 3 ? (
                  <span className="top-pos-medal" aria-hidden="true">
                    {getPositionLabel(position)}
                  </span>
                ) : (
                  <span className="top-pos-num">{position}</span>
                )}
              </div>

              <div className="top-cover">
                <CoverImage
                  coverPath={track.cover_path}
                  alt={track.title}
                  artistName={artistName}
                  gradientSeed={index}
                  imgSizes="48px"
                />
              </div>

              <div className="top-info">
                <div className="top-info-header">
                  <p className={`top-title${isActive && isPlaying ? " top-title--active" : ""}`}>
                    {track.title}
                  </p>
                  <span className="top-streams">
                    {track.listen_count.toLocaleString("fr-FR")} écoutes
                  </span>
                </div>
                <p className="top-artist">{artistName}</p>
                <div className="top-bar-track" aria-hidden="true">
                  <div className="top-bar-fill" style={{ width: `${relativeWidth}%` }} />
                </div>
              </div>

              <span className="top-duration">{formatTrackDuration(track.duration_seconds)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
