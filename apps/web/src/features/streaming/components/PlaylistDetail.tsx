"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Playlist, TrackWithMeta } from "@sonafrik/types";
import { useStreamingService } from "../hooks/useStreaming";
import { usePlayer } from "../hooks/usePlayer";
import { formatTime } from "@/lib/formatters";
import { CoverImage } from "@/components/CoverImage";
import { PlaylistPrivacyToggle } from "@/components/playlist/PlaylistPrivacyToggle";
import { PlaylistVisibilityBadge } from "@/components/playlist/PlaylistVisibilityBadge";

function TrackRow({
  track,
  index,
  isActive,
  isPlaying,
  onPlay,
  onRemove,
}: {
  track: TrackWithMeta;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: (t: TrackWithMeta) => void;
  onRemove: (trackId: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl group"
      style={{
        backgroundColor: isActive ? "#00D26A11" : "transparent",
        border: `1px solid ${isActive ? "#00D26A33" : "transparent"}`,
      }}
    >
      <button onClick={() => onPlay(track)} className="w-8 text-center flex-shrink-0">
        {isActive ? (
          isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="#00D26A" className="mx-auto">
              <rect x="1" y="1" width="4" height="12" rx="1" />
              <rect x="9" y="1" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="#00D26A" className="mx-auto">
              <path d="M3 1l10 6-10 6V1z" />
            </svg>
          )
        ) : (
          <span className="text-sm" style={{ color: "#555555" }}>{index + 1}</span>
        )}
      </button>

      <button onClick={() => onPlay(track)} className="w-10 h-10 rounded-lg flex-shrink-0 relative overflow-hidden">
        <CoverImage coverPath={track.cover_url ?? null} alt={track.title} gradientSeed={index} />
      </button>

      <button onClick={() => onPlay(track)} className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate" style={{ color: isActive ? "#00D26A" : "#FFFFFF" }}>
          {track.title}
        </p>
        {track.artist_name && (
          <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
            {track.artist_name}
          </p>
        )}
      </button>

      {track.duration_seconds ? (
        <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: "#555555" }}>
          {formatTime(track.duration_seconds)}
        </span>
      ) : null}

      <button
        onClick={() => onRemove(track.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg flex-shrink-0"
        aria-label="Retirer de la playlist"
        style={{ color: "#555555" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 3l8 8M11 3l-8 8" />
        </svg>
      </button>
    </div>
  );
}

interface Props {
  playlist: Playlist;
  initialTracks?: TrackWithMeta[];
  currentUserId?: string;
}

export function PlaylistDetail({ playlist, initialTracks, currentUserId }: Props) {
  const streaming = useStreamingService();
  const { loadQueueAndPlay, currentTrack, isPlaying } = usePlayer();
  const [tracks, setTracks] = useState<TrackWithMeta[]>(initialTracks ?? []);
  const [isLoading, setIsLoading] = useState(!initialTracks);
  const [error, setError] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(playlist.is_public);
  const isOwner = !!currentUserId && currentUserId === playlist.user_id;

  const loadTracks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const playlistTracks = await streaming.getPlaylistTracks(playlist.id);
      const tracksWithMeta: TrackWithMeta[] = playlistTracks.map((pt) => ({
        ...(pt.track as unknown as TrackWithMeta),
        id: pt.track_id,
        creator_id: (pt.track as { creator_id?: string })?.creator_id ?? "",
        album_id: (pt.track as { album_id?: string | null })?.album_id ?? null,
        title: (pt.track as { title?: string })?.title ?? "Morceau",
        slug: "",
        track_number: pt.position,
        isrc: null,
        duration_seconds: (pt.track as { duration_seconds?: number })?.duration_seconds ?? null,
        explicit: false,
        language: "fr",
        bpm: null,
        musical_key: null,
        publication_status: "published" as const,
        rejection_reason: null,
        submitted_at: null,
        published_at: null,
        metadata: {},
        created_at: pt.added_at,
        updated_at: pt.added_at,
        deleted_at: null,
        cover_url: null,
      }));
      setTracks(tracksWithMeta);
    } catch {
      setError("Impossible de charger les morceaux.");
    } finally {
      setIsLoading(false);
    }
  }, [streaming, playlist.id]);

  useEffect(() => {
    if (initialTracks) return;
    void loadTracks();
  }, [loadTracks, initialTracks]);

  const handlePlay = useCallback(async (track: TrackWithMeta) => {
    const index = tracks.findIndex((t) => t.id === track.id);
    setPlayError(null);
    try {
      await loadQueueAndPlay(tracks, index >= 0 ? index : 0);
    } catch {
      setPlayError("Impossible de lire ce morceau.");
    }
  }, [tracks, loadQueueAndPlay]);

  const handlePlayAll = useCallback(async () => {
    if (tracks.length === 0) return;
    setPlayError(null);
    try {
      await loadQueueAndPlay(tracks, 0);
    } catch {
      setPlayError("Impossible de démarrer la lecture.");
    }
  }, [tracks, loadQueueAndPlay]);

  const handlePrivacyChange = useCallback(async (newIsPublic: boolean) => {
    setIsPublic(newIsPublic);
    try {
      await streaming.updatePlaylist(playlist.id, { isPublic: newIsPublic });
    } catch {
      setIsPublic(!newIsPublic);
      setError("Impossible de modifier la visibilité.");
    }
  }, [streaming, playlist.id]);

  const handleRemove = useCallback(async (trackId: string) => {
    try {
      await streaming.removeTrackFromPlaylist(playlist.id, trackId);
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
    } catch {
      setError("Impossible de retirer ce morceau.");
    }
  }, [streaming, playlist.id]);

  const totalDuration = useMemo(
    () => tracks.reduce((sum, t) => sum + (t.duration_seconds ?? 0), 0),
    [tracks],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/library" className="mt-1 flex-shrink-0" style={{ color: "#A0A0A0" }} aria-label="Retour">
          <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L3 7l6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold" style={{ color: "#FFFFFF" }}>{playlist.title}</h1>
            <PlaylistVisibilityBadge isPublic={isPublic} />
          </div>
          {playlist.description && (
            <p className="text-sm mt-0.5" style={{ color: "#A0A0A0" }}>{playlist.description}</p>
          )}
          <p className="text-xs mt-1" style={{ color: "#555555" }}>
            {tracks.length} morceau{tracks.length !== 1 ? "x" : ""}
            {totalDuration > 0 && ` · ${formatTime(totalDuration)}`}
          </p>
        </div>
      </div>

      {/* Toggle de confidentialité — visible uniquement par le propriétaire */}
      {isOwner && (
        <PlaylistPrivacyToggle isPublic={isPublic} onChange={handlePrivacyChange} />
      )}

      {tracks.length > 0 && (
        <button
          onClick={handlePlayAll}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 1l11 6-11 6V1z" />
          </svg>
          Tout écouter
        </button>
      )}

      {playError && <p className="text-sm" role="alert" style={{ color: "#FF4D4F" }}>{playError}</p>}
      {error && <p className="text-sm" role="alert" style={{ color: "#FF6666" }}>{error}</p>}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#00D26A", borderTopColor: "transparent" }} />
        </div>
      ) : tracks.length === 0 ? (
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: "#1F1F1F" }}>
          <p className="text-2xl mb-2">🎵</p>
          <p className="text-sm" style={{ color: "#A0A0A0" }}>
            Cette playlist est vide. Ajoutez des morceaux depuis les pages albums ou artistes.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              isActive={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
