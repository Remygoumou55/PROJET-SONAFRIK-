"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiscoveryTrack, TrackWithMeta } from "@sonafrik/types";
import { filterValidTracks } from "@/lib/content-filter";
import { usePlayer } from "../hooks/usePlayer";
import { TrackCard } from "./TrackCard";

type TimeFilter = "week" | "month" | "all";

const FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois" },
  { key: "all", label: "Tout" },
];

function DiscoveriesIcon() {
  return (
    <svg
      className="discoveries-icon"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 4.5V15.5L4 13V7L8 4.5Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path
        d="M12 3.5L16 5.5V13.5L12 15.5V3.5Z"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </svg>
  );
}

function toTrackWithMeta(track: DiscoveryTrack): TrackWithMeta {
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
    published_at: track.published_at,
    metadata: {},
    created_at: track.published_at ?? new Date().toISOString(),
    updated_at: track.published_at ?? new Date().toISOString(),
    deleted_at: null,
    artist_name: track.artist_name ?? undefined,
    album_title: track.album_title ?? undefined,
    cover_url: track.cover_path ?? null,
  };
}

function getTrackAgeDays(track: DiscoveryTrack, now: Date): number {
  const dateStr = track.published_at;
  if (!dateStr) return Number.POSITIVE_INFINITY;
  const createdAt = new Date(dateStr);
  return (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
}

function matchesTimeFilter(track: DiscoveryTrack, filter: TimeFilter, now: Date): boolean {
  const diffDays = getTrackAgeDays(track, now);
  if (filter === "week") return diffDays <= 7;
  if (filter === "month") return diffDays <= 30;
  return true;
}

interface DiscoveriesSectionProps {
  tracks: DiscoveryTrack[];
}

export function DiscoveriesSection({ tracks }: DiscoveriesSectionProps) {
  const { loadQueueAndPlay, currentTrack, isPlaying } = usePlayer();
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("week");
  const [playError, setPlayError] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  const validTracks = useMemo(() => filterValidTracks(tracks), [tracks]);

  const filteredTracks = useMemo(
    () => validTracks.filter((track) => matchesTimeFilter(track, activeFilter, now)),
    [validTracks, activeFilter, now],
  );

  const tracksWithMeta = useMemo(() => filteredTracks.map(toTrackWithMeta), [filteredTracks]);

  useEffect(() => {
    setPlayError(null);
  }, []);

  async function handlePlay(index: number) {
    setPlayError(null);
    try {
      await loadQueueAndPlay(tracksWithMeta, index);
    } catch (err) {
      setPlayError(
        err instanceof Error ? err.message : "Impossible de lancer la lecture. Réessayez.",
      );
    }
  }

  if (validTracks.length === 0) return null;

  return (
    <section className="discoveries-section listen-page-section mt-8" aria-label="Découvertes musicales">
      <div className="discoveries-header listen-section-header">
        <div className="discoveries-title-wrap">
          <DiscoveriesIcon />
          <div className="discoveries-heading">
            <h2 className="discoveries-title listen-section-title">Découvertes</h2>
            <p className="discoveries-count">
              {filteredTracks.length} morceau{filteredTracks.length !== 1 ? "x" : ""}
            </p>
          </div>
        </div>

        <div className="discoveries-filters" role="tablist" aria-label="Filtrer par période">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.key}
              className={`disc-filter-btn${activeFilter === filter.key ? " active" : ""}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {playError ? (
        <p className="px-6 text-xs mb-2" role="alert" style={{ color: "var(--color-danger)" }}>
          {playError}
        </p>
      ) : null}

      {filteredTracks.length > 0 ? (
        <div className="discoveries-scroll listen-tracks-scroll" role="list">
          {filteredTracks.map((track, index) => {
            const isActive = currentTrack?.id === track.track_id;
            const isNew = getTrackAgeDays(track, now) <= 7;
            return (
              <div key={track.track_id} role="listitem" className="discovery-card-wrap">
                <TrackCard
                  title={track.title}
                  artistName={track.artist_name}
                  coverPath={track.cover_path}
                  durationSeconds={track.duration_seconds}
                  gradientSeed={index}
                  isActive={isActive && isPlaying}
                  isNew={isNew}
                  onPlay={() => void handlePlay(index)}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="discoveries-empty">
          <p>Aucun morceau sur cette période.</p>
          <button type="button" className="discoveries-empty-btn" onClick={() => setActiveFilter("all")}>
            Voir tout →
          </button>
        </div>
      )}
    </section>
  );
}
