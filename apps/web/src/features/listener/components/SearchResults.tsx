"use client";

import { useCallback, useState } from "react";
import type { SearchResult, SearchType, TrackWithMeta } from "@sonafrik/types";
import { usePlayer } from "../hooks/usePlayer";
import {
  AlbumCard,
  ArtistRow,
  BeatRow,
  PlaylistRow,
  SearchEmpty,
  SectionHeader,
  TrackRow,
} from "./SearchResultRows";

interface SearchResultsProps {
  results: SearchResult | null;
  isSearching: boolean;
  activeTab: SearchType;
  onTabChange: (tab: SearchType) => void;
}

const PREVIEW_COUNT = 5;

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
          style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!results) return null;

  if (results.total === 0) {
    return (
      <div className="py-8 text-center">
        <p style={{ color: "var(--color-texte-secondaire)" }}>Aucun résultat pour « {results.query} »</p>
        <p className="text-xs mt-1" style={{ color: "var(--color-texte-desactive)" }}>
          Essayez un terme différent ou vérifiez l&apos;orthographe.
        </p>
      </div>
    );
  }

  const { tracks, artists, albums, playlists, beats } = results;

  if (activeTab === "all") {
    return (
      <div className="space-y-6">
        {playError && (
          <p className="text-sm px-1" role="alert" style={{ color: "var(--color-erreur)" }}>{playError}</p>
        )}

        {artists.length > 0 && (
          <section>
            <SectionHeader label="Artistes" count={artists.length} hasMore={artists.length >= PREVIEW_COUNT} tab="artists" onShowAll={onTabChange} />
            <div className="space-y-1">
              {artists.slice(0, PREVIEW_COUNT).map((artist) => (
                <ArtistRow key={artist.creator_id} artist={artist} />
              ))}
            </div>
          </section>
        )}

        {tracks.length > 0 && (
          <section>
            <SectionHeader label="Morceaux" count={tracks.length} hasMore={tracks.length >= PREVIEW_COUNT} tab="tracks" onShowAll={onTabChange} />
            <div className="space-y-1">
              {tracks.slice(0, PREVIEW_COUNT).map((track) => (
                <TrackRow key={track.id} track={track} onPlay={handlePlay} />
              ))}
            </div>
          </section>
        )}

        {albums.length > 0 && (
          <section>
            <SectionHeader label="Albums" count={albums.length} hasMore={albums.length >= PREVIEW_COUNT} tab="albums" onShowAll={onTabChange} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {albums.slice(0, PREVIEW_COUNT).map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </section>
        )}

        {playlists.length > 0 && (
          <section>
            <SectionHeader label="Playlists" count={playlists.length} hasMore={playlists.length >= PREVIEW_COUNT} tab="playlists" onShowAll={onTabChange} />
            <div className="space-y-1">
              {playlists.slice(0, PREVIEW_COUNT).map((pl) => (
                <PlaylistRow key={pl.id} playlist={pl} />
              ))}
            </div>
          </section>
        )}

        {beats.length > 0 && (
          <section>
            <SectionHeader label="Beats" count={beats.length} hasMore={beats.length >= PREVIEW_COUNT} tab="beats" onShowAll={onTabChange} />
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

  return (
    <div>
      {playError && (
        <p className="text-sm px-1 mb-3" role="alert" style={{ color: "var(--color-erreur)" }}>{playError}</p>
      )}

      {activeTab === "tracks" && (
        <div className="space-y-1">
          {tracks.length === 0 ? <SearchEmpty query={results.query} /> : tracks.map((t) => (
            <TrackRow key={t.id} track={t} onPlay={handlePlay} />
          ))}
        </div>
      )}

      {activeTab === "artists" && (
        <div className="space-y-1">
          {artists.length === 0 ? <SearchEmpty query={results.query} /> : artists.map((a) => (
            <ArtistRow key={a.creator_id} artist={a} />
          ))}
        </div>
      )}

      {activeTab === "albums" && (
        albums.length === 0 ? <SearchEmpty query={results.query} /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {albums.map((a) => <AlbumCard key={a.id} album={a} />)}
          </div>
        )
      )}

      {activeTab === "playlists" && (
        <div className="space-y-1">
          {playlists.length === 0 ? <SearchEmpty query={results.query} /> : playlists.map((pl) => (
            <PlaylistRow key={pl.id} playlist={pl} />
          ))}
        </div>
      )}

      {activeTab === "beats" && (
        <div className="space-y-1">
          {beats.length === 0 ? <SearchEmpty query={results.query} /> : beats.map((b) => (
            <BeatRow key={b.id} beat={b} />
          ))}
        </div>
      )}
    </div>
  );
}
