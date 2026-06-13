"use client";

import { useState } from "react";
import type { AlbumWithMeta, LibraryItem, TrackWithMeta } from "@sonafrik/types";
import { LibraryList } from "./LibraryList";
import { CreatePlaylistModal } from "./CreatePlaylistModal";
import { FavoritesList } from "./FavoritesList";
import { useLibrary } from "../hooks/useLibrary";

type Tab = "playlists" | "favoris";

export function LibraryPage() {
  const [tab, setTab] = useState<Tab>("playlists");
  const [modalOpen, setModalOpen] = useState(false);
  const { library, isLoading, error, createPlaylist } = useLibrary();

  const favoriteTracks = library
    .filter((item): item is LibraryItem & { track: TrackWithMeta } =>
      item.entity_type === "track" && item.track !== undefined
    )
    .map((item) => item.track);

  const favoriteAlbums = library
    .filter((item): item is LibraryItem & { album: AlbumWithMeta } =>
      item.entity_type === "album" && item.album !== undefined
    )
    .map((item) => item.album);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
          Bibliothèque
        </h1>
        {tab === "playlists" && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nouvelle playlist
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(["playlists", "favoris"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors"
            style={{
              backgroundColor: tab === t ? "#00D26A" : "#1F1F1F",
              color: tab === t ? "#0D0D0D" : "#A0A0A0",
            }}
          >
            {t === "playlists" ? "Playlists" : "Favoris"}
          </button>
        ))}
      </div>

      {tab === "playlists" && <LibraryList />}
      {tab === "favoris" && (
        <FavoritesList
          tracks={favoriteTracks}
          albums={favoriteAlbums}
          isLoading={isLoading}
          error={error}
        />
      )}

      <CreatePlaylistModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={async (title, description, isPublic) => {
          await createPlaylist(title, description, isPublic);
        }}
      />
    </div>
  );
}
