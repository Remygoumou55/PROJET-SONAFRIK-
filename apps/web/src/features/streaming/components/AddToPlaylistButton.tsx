"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Playlist } from "@sonafrik/types";
import { useStreamingService } from "../hooks/useStreaming";

interface Props {
  trackId: string;
}

export function AddToPlaylistButton({ trackId }: Props) {
  const streaming = useStreamingService();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ferme au clic extérieur
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const handleOpen = useCallback(async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const list = await streaming.listPlaylists();
      setPlaylists(list);
    } catch {
      setError("Impossible de charger les playlists.");
    } finally {
      setLoading(false);
    }
  }, [open, streaming]);

  const handleAdd = useCallback(async (playlistId: string) => {
    if (addedIds.has(playlistId)) return;
    try {
      await streaming.addTrackToPlaylist({ playlistId, trackId });
      setAddedIds((prev) => new Set(prev).add(playlistId));
    } catch {
      setError("Impossible d'ajouter ce morceau.");
    }
  }, [addedIds, streaming, trackId]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        aria-label="Ajouter à une playlist"
        title="Ajouter à une playlist"
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: open ? "#00D26A" : "#555555" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4h12M2 8h8M2 12h5M13 10v6M10 13h6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-1 right-0 z-50 rounded-xl shadow-xl min-w-[180px] py-2"
          style={{ backgroundColor: "#2A2A2A", border: "1px solid #333333" }}
        >
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "#555555" }}>
            Ajouter à
          </p>
          {loading && (
            <div className="px-3 py-2">
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00D26A" }} />
            </div>
          )}
          {error && <p className="px-3 py-1 text-xs" style={{ color: "#FF6666" }}>{error}</p>}
          {!loading && playlists.length === 0 && !error && (
            <p className="px-3 py-2 text-xs" style={{ color: "#A0A0A0" }}>Aucune playlist</p>
          )}
          {playlists.map((pl) => {
            const added = addedIds.has(pl.id);
            return (
              <button
                key={pl.id}
                onClick={() => void handleAdd(pl.id)}
                disabled={added}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors disabled:opacity-60"
                style={{ color: added ? "#00D26A" : "#FFFFFF" }}
                onMouseEnter={(e) => { if (!added) (e.currentTarget as HTMLElement).style.backgroundColor = "#333333"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                {added ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="#00D26A"><path d="M2 6l3 3 5-5" stroke="#00D26A" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2v8M2 6h8" /></svg>
                )}
                <span className="truncate">{pl.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
