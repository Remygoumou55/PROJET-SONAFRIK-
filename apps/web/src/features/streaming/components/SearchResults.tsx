"use client";

import { memo, useCallback, useState } from "react";
import Link from "next/link";
import type {
  AlbumWithMeta,
  ArtistResult,
  BeatSearchResult,
  PlaylistSearchResult,
  SearchResult,
  SearchType,
  TrackWithMeta,
} from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";
import { getInitials } from "@/lib/utils";
import { CoverImage } from "@/components/CoverImage";

interface SearchResultsProps {
  results: SearchResult | null;
  isSearching: boolean;
  activeTab: SearchType;
  onTabChange: (tab: SearchType) => void;
}

const PREVIEW_COUNT = 5;

// ─── Composants de ligne ────────────────────────────────────────────────────

const TrackRow = memo(function TrackRow({
  track,
  onPlay,
}: {
  track: TrackWithMeta;
  onPlay: (track: TrackWithMeta) => void;
}) {
  return (
    <button
      className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors hover:bg-[#1F1F1F]"
      onClick={() => onPlay(track)}
    >
      <div className="w-10 h-10 rounded-md flex-shrink-0 relative overflow-hidden">
        <CoverImage coverPath={track.cover_url ?? null} alt={track.title} imgSizes="40px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
          {track.title}
        </p>
        {track.artist_name && (
          <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
            {track.artist_name}
          </p>
        )}
      </div>
      {track.duration_seconds && (
        <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: "#555555" }}>
          {Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, "0")}
        </span>
      )}
    </button>
  );
});

const ArtistRow = memo(function ArtistRow({ artist }: { artist: ArtistResult }) {
  return (
    <Link
      href={`/listen/artist/${artist.creator_id}`}
      className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors hover:bg-[#1F1F1F]"
    >
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: "#2A2A2A", color: "#00D26A" }}
      >
        {getInitials(artist.stage_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
          {artist.stage_name}
          {artist.verified && (
            <span className="ml-1.5 text-xs" style={{ color: "#FFC20E" }}>✓</span>
          )}
        </p>
        {artist.genres.length > 0 && (
          <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
            {artist.genres.slice(0, 2).join(" · ")}
          </p>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#555555", flexShrink: 0 }}>
        <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
});

const AlbumCard = memo(function AlbumCard({ album }: { album: AlbumWithMeta }) {
  return (
    <Link
      href={`/listen/album/${album.id}`}
      className="rounded-xl p-3 flex flex-col gap-2 transition-colors"
      style={{ backgroundColor: "#1F1F1F" }}
    >
      <div className="aspect-square rounded-lg w-full relative overflow-hidden">
        <CoverImage
          coverPath={album.cover_url ?? null}
          alt={album.title}
          imgSizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
      </div>
      <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
        {album.title}
      </p>
      {album.artist_name && (
        <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
          {album.artist_name}
        </p>
      )}
    </Link>
  );
});

const PlaylistRow = memo(function PlaylistRow({ playlist }: { playlist: PlaylistSearchResult }) {
  return (
    <Link
      href={`/listen/playlist/${playlist.id}`}
      className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors hover:bg-[#1F1F1F]"
    >
      <div
        className="w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: "#2A2A2A" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h8M2 12h5" stroke="#00D26A" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 10v4M10 12h4" stroke="#00D26A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
          {playlist.title}
        </p>
        <p className="text-xs" style={{ color: "#A0A0A0" }}>
          {playlist.track_count} morceau{playlist.track_count !== 1 ? "x" : ""}
        </p>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#555555", flexShrink: 0 }}>
        <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
});

const BeatRow = memo(function BeatRow({ beat }: { beat: BeatSearchResult }) {
  return (
    <Link
      href={`/beats/${beat.slug}`}
      className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors hover:bg-[#1F1F1F]"
    >
      <div className="w-10 h-10 rounded-md flex-shrink-0 relative overflow-hidden">
        <CoverImage coverPath={beat.cover_path ?? null} alt={beat.title} imgSizes="40px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
          {beat.title}
        </p>
        <p className="text-xs" style={{ color: "#A0A0A0" }}>
          {beat.genre ?? "Beat"}
          {beat.bpm ? ` · ${beat.bpm} BPM` : ""}
        </p>
      </div>
      <span className="text-xs font-semibold flex-shrink-0" style={{ color: "#FFC20E" }}>
        {beat.price_gnf === 0 ? "Gratuit" : `${beat.price_gnf.toLocaleString("fr-FR")} GNF`}
      </span>
    </Link>
  );
});

// ─── Entête de section avec lien "Voir tout" ────────────────────────────────

function SectionHeader({
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
      <h3 className="text-sm font-semibold" style={{ color: "#A0A0A0" }}>{label}</h3>
      {hasMore && (
        <button
          onClick={() => onShowAll(tab)}
          className="text-xs font-medium hover:underline"
          style={{ color: "#00D26A" }}
        >
          Voir tout
        </button>
      )}
    </div>
  );
}

function Empty({ query }: { query: string }) {
  return (
    <div className="py-8 text-center">
      <p style={{ color: "#A0A0A0" }}>Aucun résultat pour « {query} »</p>
      <p className="text-xs mt-1" style={{ color: "#555555" }}>
        Essayez un terme différent ou consultez un autre onglet.
      </p>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function SearchResults({ results, isSearching, activeTab, onTabChange }: SearchResultsProps) {
  const { loadQueueAndPlay } = usePlayer();
  const [playError, setPlayError] = useState<string | null>(null);

  const handlePlay = useCallback(
    async (track: TrackWithMeta) => {
      if (!results) return;
      const index = results.tracks.findIndex((t) => t.id === track.id);
      setPlayError(null);
      try {
        await loadQueueAndPlay(results.tracks, index >= 0 ? index : 0);
      } catch {
        setPlayError("Impossible de lire ce morceau. Réessayez.");
      }
    },
    [results, loadQueueAndPlay],
  );

  if (isSearching) {
    return (
      <div className="flex justify-center py-8">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: "#00D26A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!results) return null;

  if (results.total === 0) {
    return (
      <div className="py-8 text-center">
        <p style={{ color: "#A0A0A0" }}>Aucun résultat pour « {results.query} »</p>
        <p className="text-xs mt-1" style={{ color: "#555555" }}>
          Essayez un terme différent ou vérifiez l&apos;orthographe.
        </p>
      </div>
    );
  }

  const { tracks, artists, albums, playlists, beats } = results;

  // ── Vue "Tout" ─────────────────────────────────────────────────────────────
  if (activeTab === "all") {
    return (
      <div className="space-y-6">
        {playError && (
          <p className="text-sm text-red-500 px-1" role="alert">{playError}</p>
        )}

        {artists.length > 0 && (
          <section>
            <SectionHeader
              label="Artistes"
              count={artists.length}
              hasMore={artists.length >= PREVIEW_COUNT}
              tab="artists"
              onShowAll={onTabChange}
            />
            <div className="space-y-1">
              {artists.slice(0, PREVIEW_COUNT).map((artist) => (
                <ArtistRow key={artist.creator_id} artist={artist} />
              ))}
            </div>
          </section>
        )}

        {tracks.length > 0 && (
          <section>
            <SectionHeader
              label="Morceaux"
              count={tracks.length}
              hasMore={tracks.length >= PREVIEW_COUNT}
              tab="tracks"
              onShowAll={onTabChange}
            />
            <div className="space-y-1">
              {tracks.slice(0, PREVIEW_COUNT).map((track) => (
                <TrackRow key={track.id} track={track} onPlay={handlePlay} />
              ))}
            </div>
          </section>
        )}

        {albums.length > 0 && (
          <section>
            <SectionHeader
              label="Albums"
              count={albums.length}
              hasMore={albums.length >= PREVIEW_COUNT}
              tab="albums"
              onShowAll={onTabChange}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {albums.slice(0, PREVIEW_COUNT).map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </section>
        )}

        {playlists.length > 0 && (
          <section>
            <SectionHeader
              label="Playlists"
              count={playlists.length}
              hasMore={playlists.length >= PREVIEW_COUNT}
              tab="playlists"
              onShowAll={onTabChange}
            />
            <div className="space-y-1">
              {playlists.slice(0, PREVIEW_COUNT).map((pl) => (
                <PlaylistRow key={pl.id} playlist={pl} />
              ))}
            </div>
          </section>
        )}

        {beats.length > 0 && (
          <section>
            <SectionHeader
              label="Beats"
              count={beats.length}
              hasMore={beats.length >= PREVIEW_COUNT}
              tab="beats"
              onShowAll={onTabChange}
            />
            <div className="space-y-1">
              {beats.slice(0, PREVIEW_COUNT).map((beat) => (
                <BeatRow key={beat.id} beat={beat} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ── Vues par onglet spécifique ─────────────────────────────────────────────
  return (
    <div>
      {playError && (
        <p className="text-sm text-red-500 px-1 mb-3" role="alert">{playError}</p>
      )}

      {activeTab === "tracks" && (
        <div className="space-y-1">
          {tracks.length === 0 ? <Empty query={results.query} /> : tracks.map((t) => (
            <TrackRow key={t.id} track={t} onPlay={handlePlay} />
          ))}
        </div>
      )}

      {activeTab === "artists" && (
        <div className="space-y-1">
          {artists.length === 0 ? <Empty query={results.query} /> : artists.map((a) => (
            <ArtistRow key={a.creator_id} artist={a} />
          ))}
        </div>
      )}

      {activeTab === "albums" && (
        <>
          {albums.length === 0 ? <Empty query={results.query} /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {albums.map((a) => <AlbumCard key={a.id} album={a} />)}
            </div>
          )}
        </>
      )}

      {activeTab === "playlists" && (
        <div className="space-y-1">
          {playlists.length === 0 ? <Empty query={results.query} /> : playlists.map((pl) => (
            <PlaylistRow key={pl.id} playlist={pl} />
          ))}
        </div>
      )}

      {activeTab === "beats" && (
        <div className="space-y-1">
          {beats.length === 0 ? <Empty query={results.query} /> : beats.map((b) => (
            <BeatRow key={b.id} beat={b} />
          ))}
        </div>
      )}
    </div>
  );
}
