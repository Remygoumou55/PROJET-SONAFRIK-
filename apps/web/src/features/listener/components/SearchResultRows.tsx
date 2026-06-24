"use client";

import { memo } from "react";
import Link from "next/link";
import type {
  AlbumWithMeta,
  ArtistResult,
  BeatSearchResult,
  PlaylistSearchResult,
  SearchType,
  TrackWithMeta,
} from "@sonafrik/types";
import { getInitials } from "@/lib/utils";
import { CoverImage } from "@/components/CoverImage";

export const TrackRow = memo(function TrackRow({
  track,
  onPlay,
}: {
  track: TrackWithMeta;
  onPlay: (track: TrackWithMeta) => void;
}) {
  return (
    <button
      className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors hover:bg-[var(--color-card)]"
      onClick={() => onPlay(track)}
    >
      <div className="w-10 h-10 rounded-md flex-shrink-0 relative overflow-hidden">
        <CoverImage coverPath={track.cover_url ?? null} alt={track.title} imgSizes="40px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-texte-principal)" }}>
          {track.title}
        </p>
        {track.artist_name && (
          <p className="text-xs truncate" style={{ color: "var(--color-texte-secondaire)" }}>
            {track.artist_name}
          </p>
        )}
      </div>
      {track.duration_seconds && (
        <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: "var(--color-texte-desactive)" }}>
          {Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, "0")}
        </span>
      )}
    </button>
  );
});

export const ArtistRow = memo(function ArtistRow({ artist }: { artist: ArtistResult }) {
  return (
    <Link
      href={`/listen/artist/${artist.creator_id}`}
      className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors hover:bg-[var(--color-card)]"
    >
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-vert-energie)" }}
      >
        {getInitials(artist.stage_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-texte-principal)" }}>
          {artist.stage_name}
          {artist.verified && (
            <span className="ml-1.5 text-xs" style={{ color: "var(--color-or-solaire)" }}>✓</span>
          )}
        </p>
        {artist.genres.length > 0 && (
          <p className="text-xs truncate" style={{ color: "var(--color-texte-secondaire)" }}>
            {artist.genres.slice(0, 2).join(" · ")}
          </p>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--color-texte-desactive)", flexShrink: 0 }}>
        <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
});

export const AlbumCard = memo(function AlbumCard({ album }: { album: AlbumWithMeta }) {
  return (
    <Link
      href={`/listen/album/${album.id}`}
      className="rounded-xl p-3 flex flex-col gap-2 transition-colors"
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <div className="aspect-square rounded-lg w-full relative overflow-hidden">
        <CoverImage
          coverPath={album.cover_url ?? null}
          alt={album.title}
          imgSizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
      </div>
      <p className="text-sm font-medium truncate" style={{ color: "var(--color-texte-principal)" }}>
        {album.title}
      </p>
      {album.artist_name && (
        <p className="text-xs truncate" style={{ color: "var(--color-texte-secondaire)" }}>
          {album.artist_name}
        </p>
      )}
    </Link>
  );
});

export const PlaylistRow = memo(function PlaylistRow({ playlist }: { playlist: PlaylistSearchResult }) {
  return (
    <Link
      href={`/library/playlist/${playlist.id}`}
      className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors hover:bg-[var(--color-card)]"
    >
      <div
        className="w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: "var(--color-elevated)" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h8M2 12h5" stroke="var(--color-vert-energie)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 10v4M10 12h4" stroke="var(--color-vert-energie)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-texte-principal)" }}>
          {playlist.title}
        </p>
        <p className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>
          {playlist.track_count} morceau{playlist.track_count !== 1 ? "x" : ""}
        </p>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--color-texte-desactive)", flexShrink: 0 }}>
        <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
});

export const BeatRow = memo(function BeatRow({ beat }: { beat: BeatSearchResult }) {
  return (
    <Link
      href={`/listen/beats?beat=${beat.id}`}
      className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors hover:bg-[var(--color-card)]"
    >
      <div className="w-10 h-10 rounded-md flex-shrink-0 relative overflow-hidden">
        <CoverImage coverPath={beat.cover_path ?? null} alt={beat.title} imgSizes="40px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-texte-principal)" }}>
          {beat.title}
        </p>
        <p className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>
          {beat.genre ?? "Beat"}
          {beat.bpm ? ` · ${beat.bpm} BPM` : ""}
        </p>
      </div>
      <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--color-or-solaire)" }}>
        {beat.price_gnf === 0 ? "Gratuit" : `${beat.price_gnf.toLocaleString("fr-FR")} GNF`}
      </span>
    </Link>
  );
});

export function SectionHeader({
  label,
  count,
  hasMore,
  tab,
  onShowAll,
}: {
  label: string;
  count: number;
  hasMore: boolean;
  tab: SearchType;
  onShowAll: (tab: SearchType) => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-semibold" style={{ color: "var(--color-texte-secondaire)" }}>{label}</h3>
      {hasMore && (
        <button
          onClick={() => onShowAll(tab)}
          className="text-xs font-medium hover:underline"
          style={{ color: "var(--color-vert-energie)" }}
        >
          Voir tout
        </button>
      )}
    </div>
  );
}

export function SearchEmpty({ query }: { query: string }) {
  return (
    <div className="py-8 text-center">
      <p style={{ color: "var(--color-texte-secondaire)" }}>Aucun résultat pour « {query} »</p>
      <p className="text-xs mt-1" style={{ color: "var(--color-texte-desactive)" }}>
        Essayez un terme différent ou consultez un autre onglet.
      </p>
    </div>
  );
}
