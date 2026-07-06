"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DiscoveryTrack } from "@sonafrik/types";
import { usePlayer } from "../../hooks/usePlayer";
import { TrackCard } from "../TrackCard";
import {
  DEFAULT_TIME_FILTER,
  DISCOVERIES_FILTERS,
  getFilteredTracks,
  getTrackAgeDays,
  toTrackWithMeta,
  type TimeFilter,
} from "./discoveries.utils";

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
      <path d="M8 4.5V15.5L4 13V7L8 4.5Z" fill="currentColor" fillOpacity="0.9" />
      <path d="M12 3.5L16 5.5V13.5L12 15.5V3.5Z" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}

interface DiscoveriesSectionClientProps {
  validTracks: DiscoveryTrack[];
  initialFilter?: TimeFilter;
  initialFilteredCount: number;
  children: ReactNode;
}

/** Client Island — filtres, lecture, état actif ; ne bloque pas le paint SSR. */
export function DiscoveriesSectionClient({
  validTracks,
  initialFilter = DEFAULT_TIME_FILTER,
  initialFilteredCount,
  children,
}: DiscoveriesSectionClientProps) {
  const { loadQueueAndPlay, currentTrack, isPlaying } = usePlayer();
  const [activeFilter, setActiveFilter] = useState<TimeFilter>(initialFilter);
  const [playError, setPlayError] = useState<string | null>(null);
  const shellGridRef = useRef<HTMLDivElement>(null);
  const now = useMemo(() => new Date(), []);

  const filteredTracks = useMemo(
    () => getFilteredTracks(validTracks, activeFilter, now),
    [validTracks, activeFilter, now],
  );

  const tracksWithMeta = useMemo(
    () => filteredTracks.map(toTrackWithMeta),
    [filteredTracks],
  );

  const useServerShell = activeFilter === initialFilter;

  useEffect(() => {
    setPlayError(null);
  }, []);

  useEffect(() => {
    const grid = shellGridRef.current;
    if (!grid || !useServerShell) return;

    const cards = grid.querySelectorAll<HTMLElement>("[data-track-id]");
    cards.forEach((card) => {
      const trackId = card.dataset.trackId;
      const active = Boolean(trackId && currentTrack?.id === trackId && isPlaying);
      card.classList.toggle("listen-track-card--active", active);
      const btn = card.querySelector(".discoveries-play-btn");
      if (btn) {
        btn.innerHTML = active
          ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="1" width="4" height="14" rx="1"/><rect x="10" y="1" width="4" height="14" rx="1"/></svg>'
          : '<svg width="14" height="16" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0L10 6L0 12V0Z"/></svg>';
      }
    });
  }, [currentTrack?.id, isPlaying, useServerShell, children]);

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

  function handleShellGridClick(event: React.MouseEvent<HTMLDivElement>) {
    const card = (event.target as HTMLElement).closest<HTMLElement>("[data-track-index]");
    if (!card?.dataset.trackIndex) return;
    const index = Number.parseInt(card.dataset.trackIndex, 10);
    if (!Number.isNaN(index)) {
      void handlePlay(index);
    }
  }

  const displayCount = useServerShell ? initialFilteredCount : filteredTracks.length;

  return (
    <section className="discoveries-section listen-page-section mt-8" aria-label="Découvertes musicales">
      <div className="discoveries-header listen-section-header">
        <div className="discoveries-title-wrap">
          <DiscoveriesIcon />
          <div className="discoveries-heading">
            <h2 className="discoveries-title listen-section-title">Découvertes</h2>
            <p className="discoveries-count">
              {displayCount} morceau{displayCount !== 1 ? "x" : ""}
            </p>
          </div>
        </div>

        <div className="discoveries-filters" role="tablist" aria-label="Filtrer par période">
          {DISCOVERIES_FILTERS.map((filter) => (
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

      {useServerShell && filteredTracks.length > 0 ? (
        <div
          ref={shellGridRef}
          className="discoveries-interactive-shell"
          onClick={handleShellGridClick}
          role="presentation"
        >
          {children}
        </div>
      ) : null}

      {useServerShell && filteredTracks.length === 0 ? (
        <div className="discoveries-empty">
          <p>Aucun morceau sur cette période.</p>
          <button type="button" className="discoveries-empty-btn" onClick={() => setActiveFilter("all")}>
            Voir tout →
          </button>
        </div>
      ) : null}

      {!useServerShell && filteredTracks.length > 0 ? (
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
      ) : null}

      {!useServerShell && filteredTracks.length === 0 ? (
        <div className="discoveries-empty">
          <p>Aucun morceau sur cette période.</p>
          <button type="button" className="discoveries-empty-btn" onClick={() => setActiveFilter("all")}>
            Voir tout →
          </button>
        </div>
      ) : null}
    </section>
  );
}
