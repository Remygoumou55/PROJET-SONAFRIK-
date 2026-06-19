"use client";

import Link from "next/link";
import type { Playlist } from "@sonafrik/types";
import { useLibrary } from "../hooks/useLibrary";
import { PlaylistVisibilityBadge } from "@/components/playlist/PlaylistVisibilityBadge";

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
      <Link href={`/library/playlist/${playlist.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: "#2A2A2A" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#00D26A">
            <path d="M4 6h12M4 10h8M4 14h10" stroke="#00D26A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold truncate" style={{ color: "#FFFFFF" }}>
              {playlist.title}
            </p>
            <PlaylistVisibilityBadge isPublic={playlist.is_public} />
          </div>
          <p className="text-sm" style={{ color: "#A0A0A0" }}>
            {playlist.track_count ?? 0} morceau{(playlist.track_count ?? 0) !== 1 ? "x" : ""}
          </p>
        </div>
      </Link>
      <button
        onClick={() => onDelete(playlist.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg flex-shrink-0"
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

export function LibraryList() {
  const { playlists, isLoading, error, deletePlaylist } = useLibrary();

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
      {playlists.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-4xl mb-4">🎵</p>
          <p className="text-lg font-semibold mb-2" style={{ color: "#FFFFFF" }}>
            Vous n&apos;avez pas encore de playlists
          </p>
          <p className="text-sm" style={{ color: "#A0A0A0" }}>
            Utilisez le bouton <span style={{ color: "#00D26A" }}>+ Nouvelle playlist</span> ci-dessus pour commencer.
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
