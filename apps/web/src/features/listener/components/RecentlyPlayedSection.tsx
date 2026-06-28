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
    <div className="ls-recently">
      <p className="ls-section-label">En écoute</p>
      {tracks.map((track, index) => (
        <button
          key={track.trackId}
          type="button"
          className="ls-recently-item"
          onClick={() => void loadAndPlay(toTrackWithMeta(track))}
        >
          <div className="ls-recently-cover">
            <CoverImage coverPath={track.coverPath} alt={track.title} gradientSeed={index} imgSizes="36px" />
          </div>
          <div className="ls-recently-info">
            <p className="ls-recently-title">{track.title}</p>
            <p className="ls-recently-artist">{track.artistName}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
