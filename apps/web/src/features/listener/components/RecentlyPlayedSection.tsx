"use client";

import type { TrackWithMeta } from "@sonafrik/types";
import type { RecentlyPlayedTrack } from "@sonafrik/types";
import { CoverImage } from "@/components/CoverImage";
import { usePlayer } from "../hooks/usePlayer";

function toTrackWithMeta(track: RecentlyPlayedTrack): TrackWithMeta {
  return {
    id: track.trackId,
    creator_id: track.creatorId,
    album_id: null,
    title: track.title,
    slug: track.trackId,
    track_number: 0,
    isrc: null,
    duration_seconds: track.durationSeconds,
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
    artist_name: track.artistName,
    cover_url: track.coverPath,
  };
}

interface RecentlyPlayedSectionProps {
  tracks: RecentlyPlayedTrack[];
}

export function RecentlyPlayedSection({ tracks }: RecentlyPlayedSectionProps) {
  const { loadAndPlay } = usePlayer();

  if (tracks.length === 0) return null;

  return (
    <div className="sidebar-recently">
      <p className="sidebar-section-label">Récemment écouté</p>
      {tracks.map((track, index) => (
        <button
          key={track.trackId}
          type="button"
          className="sidebar-recent-item"
          onClick={() => void loadAndPlay(toTrackWithMeta(track))}
        >
          <div className="sidebar-recent-cover">
            <CoverImage coverPath={track.coverPath} alt={track.title} gradientSeed={index} imgSizes="36px" />
          </div>
          <div className="sidebar-recent-info">
            <p className="sidebar-recent-title">{track.title}</p>
            <p className="sidebar-recent-artist">{track.artistName}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
