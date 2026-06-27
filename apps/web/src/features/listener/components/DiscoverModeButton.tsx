"use client";

import { useState } from "react";
import type { DiscoveryTrack, TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";

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

export function DiscoverModeButton() {
  const { loadQueueAndPlay } = usePlayer();
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDiscover() {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/listener/discover?limit=20");
      if (!response.ok) throw new Error("discover_failed");
      const payload = (await response.json()) as { tracks?: DiscoveryTrack[] };
      const tracks = payload.tracks ?? [];
      if (tracks.length === 0) {
        setError("Aucun morceau à découvrir pour le moment.");
        return;
      }
      const withMeta = tracks.map(toTrackWithMeta);
      await loadQueueAndPlay(withMeta, 0);
      setIsActive(true);
    } catch {
      setError("Impossible de lancer le mode Découverte.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="discover-mode-wrap">
      <button
        type="button"
        className={`discover-mode-btn${isActive ? " active" : ""}${isLoading ? " loading" : ""}`}
        onClick={() => void handleDiscover()}
        disabled={isLoading}
        aria-label="Lancer le mode Découverte"
      >
        <span className="discover-icon" aria-hidden="true">
          {isLoading ? "⏳" : "🎲"}
        </span>
        <div className="discover-text">
          <span className="discover-label">
            {isLoading ? "Recherche..." : isActive ? "Mode Découverte actif" : "Mode Découverte"}
          </span>
          <span className="discover-sub">Musique basée sur vos goûts</span>
        </div>
        {isActive ? <span className="discover-active-dot" aria-hidden="true" /> : null}
      </button>
      {error ? (
        <p className="discover-mode-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
