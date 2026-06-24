"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const playlistsCache: { data: import("@sonafrik/types").Playlist[]; at: number } = { data: [], at: 0 };
const CACHE_TTL = 60_000;
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
    if (Date.now() - playlistsCache.at < CACHE_TTL) {
      setPlaylists(playlistsCache.data);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await streaming.listPlaylists();
      playlistsCache.data = list;
      playlistsCache.at = Date.now();
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
        style={{ color: open ? "var(--color-vert-energie)" : "var(--color-texte-desactive)" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4h12M2 8h8M2 12h5M13 10v6M10 13h6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-1 right-0 z-50 rounded-xl shadow-xl min-w-[180px] py-2"
          style={{ backgroundColor: "var(--color-elevated)", border: "1px solid var(--color-bordure)" }}
        >
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-texte-desactive)" }}>
            Ajouter à
          </p>
          {loading && (
            <div className="px-3 py-2">
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-vert-energie)" }} />
            </div>
          )}
          {error && <p className="px-3 py-1 text-xs" style={{ color: "var(--color-erreur)" }}>{error}</p>}
          {!loading && playlists.length === 0 && !error && (
            <p className="px-3 py-2 text-xs" style={{ color: "var(--color-texte-secondaire)" }}>Aucune playlist</p>
          )}
          {playlists.map((pl) => {
            const added = addedIds.has(pl.id);
            return (
              <button
                key={pl.id}
                onClick={() => void handleAdd(pl.id)}
                disabled={added}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors disabled:opacity-60"
                style={{ color: added ? "var(--color-vert-energie)" : "var(--color-texte-principal)" }}
                onMouseEnter={(e) => { if (!added) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-bordure)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                {added ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--color-vert-energie)"><path d="M2 6l3 3 5-5" stroke="var(--color-vert-energie)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
