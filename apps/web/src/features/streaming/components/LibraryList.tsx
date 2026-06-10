"use client";

import { useState } from "react";
import type { Playlist } from "@sonafrik/types";
import { useLibrary } from "../hooks/useLibrary";

function PlaylistCard({
  playlist,
  onDelete,
}: {
  playlist: Playlist;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-4 group"
      style={{ backgroundColor: "#1F1F1F" }}
    >
      <div
        className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: "#2A2A2A" }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="#00D26A">
          <path d="M4 6h12M4 10h8M4 14h10" stroke="#00D26A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" style={{ color: "#FFFFFF" }}>
          {playlist.title}
        </p>
        <p className="text-sm" style={{ color: "#A0A0A0" }}>
          {playlist.track_count} morceau{playlist.track_count !== 1 ? "x" : ""}
        </p>
      </div>
      <button
        onClick={() => onDelete(playlist.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg"
        style={{ color: "#555555" }}
        aria-label="Supprimer la playlist"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8L13 4H3z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function CreatePlaylistForm({ onCreate }: { onCreate: (title: string) => void }) {
  const [title, setTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 w-full p-4 rounded-xl border-dashed border-2 transition-colors"
        style={{ borderColor: "#333333", color: "#A0A0A0" }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-sm">Nouvelle playlist</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) {
          onCreate(title.trim());
          setTitle("");
          setIsOpen(false);
        }
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nom de la playlist"
        autoFocus
        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          backgroundColor: "#2A2A2A",
          color: "#FFFFFF",
          border: "1px solid #333333",
        }}
        maxLength={200}
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg text-sm font-semibold"
        style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
      >
        Créer
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="px-3 py-2 rounded-lg text-sm"
        style={{ backgroundColor: "#2A2A2A", color: "#A0A0A0" }}
      >
        Annuler
      </button>
    </form>
  );
}

export function LibraryList() {
  const { playlists, isLoading, error, createPlaylist, deletePlaylist } = useLibrary();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "#00D26A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p style={{ color: "#A0A0A0" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CreatePlaylistForm onCreate={createPlaylist} />
      {playlists.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: "#FFFFFF" }}>
            Aucune playlist
          </p>
          <p style={{ color: "#A0A0A0" }}>
            Créez votre première playlist pour organiser votre musique.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} onDelete={deletePlaylist} />
          ))}
        </div>
      )}
    </div>
  );
}
