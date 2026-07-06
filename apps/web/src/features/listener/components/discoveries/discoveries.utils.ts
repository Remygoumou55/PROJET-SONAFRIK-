import type { DiscoveryTrack, TrackWithMeta } from "@sonafrik/types";

export type TimeFilter = "week" | "month" | "all";

export const DISCOVERIES_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois" },
  { key: "all", label: "Tout" },
];

export const DEFAULT_TIME_FILTER: TimeFilter = "week";

export function toTrackWithMeta(track: DiscoveryTrack): TrackWithMeta {
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

export function getTrackAgeDays(track: DiscoveryTrack, now: Date): number {
  const dateStr = track.published_at;
  if (!dateStr) return Number.POSITIVE_INFINITY;
  const createdAt = new Date(dateStr);
  return (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
}

export function matchesTimeFilter(track: DiscoveryTrack, filter: TimeFilter, now: Date): boolean {
  const diffDays = getTrackAgeDays(track, now);
  if (filter === "week") return diffDays <= 7;
  if (filter === "month") return diffDays <= 30;
  return true;
}

export function getFilteredTracks(
  tracks: DiscoveryTrack[],
  filter: TimeFilter,
  now: Date,
): DiscoveryTrack[] {
  return tracks.filter((track) => matchesTimeFilter(track, filter, now));
}
