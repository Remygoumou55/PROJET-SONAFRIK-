"use client";

import { memo, useState, useEffect } from "react";
import { usePlayer } from "../hooks/usePlayer";
import { usePlayerPosition } from "../lib/playerContext";
import { useTrackCredits } from "../hooks/useTrackCredits";
import { useStreamQuality } from "../hooks/useStreamQuality";
import { PlayerControls } from "./PlayerControls";
import { PlayerProgressBar, formatTime } from "./PlayerProgressBar";
import { TipPanel } from "./TipPanel";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/features/social/components/LikeButton";
import { TrackCredits } from "@/components/track/TrackCredits";

export const WebPlayer = memo(function WebPlayer() {
  const { currentTrack, duration, setVolume, volume, seek, audioError, clearAudioError } = usePlayer();
  const currentPosition = usePlayerPosition();
  const [showCredits, setShowCredits] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const { credits } = useTrackCredits(showCredits ? currentTrack?.id : null);
  const { qualityLevel } = useStreamQuality();

  useEffect(() => {
    setShowTip(false);
    setShowCredits(false);
  }, [currentTrack?.id]);

  if (!currentTrack) return null;

  return (
    <div
      className="fixed left-0 right-0 z-50 px-4 py-3 bottom-16 md:bottom-0"
      style={{ backgroundColor: "var(--color-surface)", borderTop: "1px solid var(--color-elevated)" }}
    >
      {audioError && (
        <div
          className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-lg text-xs"
          style={{ backgroundColor: "rgba(255,68,68,0.09)", border: "1px solid rgba(255,68,68,0.2)", color: "var(--color-erreur)" }}
        >
          <span>{audioError}</span>
          <button
            onClick={clearAudioError}
            className="ml-3 text-xs opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Fermer l'erreur"
          >
            ✕
          </button>
        </div>
      )}
      <div className="max-w-screen-xl mx-auto">
        {showTip && currentTrack.creator_id && (
          <TipPanel creatorId={currentTrack.creator_id} artistName={currentTrack.artist_name ?? "l'artiste"} />
        )}
        <PlayerProgressBar currentPosition={currentPosition} duration={duration} onSeek={seek} />
        {qualityLevel !== "standard" && (
          <div className="flex justify-end mt-1">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(255,194,14,0.1)",
                color: "var(--color-or-solaire)",
                border: "1px solid rgba(255,194,14,0.2)",
              }}
            >
              {qualityLevel === "ultra_economique" ? "Ultra-économie" : "Économie de données"}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 md:gap-4 mt-3">
          {/* Track info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-md flex-shrink-0 relative overflow-hidden">
              <CoverImage coverPath={currentTrack.cover_url ?? null} alt={currentTrack.title} imgSizes="40px" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--color-texte-principal)" }}
              >
                {currentTrack.title}
              </p>
              {currentTrack.artist_name && (
                <p className="text-xs truncate" style={{ color: "var(--color-texte-secondaire)" }}>
                  {currentTrack.artist_name}
                </p>
              )}
            </div>
            <LikeButton trackId={currentTrack.id} size="sm" />
            {currentTrack.creator_id && (
              <button
                onClick={() => setShowTip((v) => !v)}
                className="text-xs px-2 py-1 rounded-md transition-colors flex-shrink-0"
                style={{
                  color: showTip ? "var(--color-vert-energie)" : "var(--color-texte-secondaire)",
                  backgroundColor: showTip ? "rgba(0,210,106,0.09)" : "transparent",
                }}
                aria-label="Soutenir l'artiste"
                title="Soutenir"
              >
                Soutenir
              </button>
            )}
            <button
              onClick={() => setShowCredits((v) => !v)}
              className="text-xs px-2 py-1 rounded-md transition-colors flex-shrink-0"
              style={{
                color: showCredits ? "var(--color-vert-energie)" : "var(--color-texte-secondaire)",
                backgroundColor: showCredits ? "rgba(0,210,106,0.09)" : "transparent",
              }}
              aria-label="Afficher les crédits"
              title="Crédits"
            >
              Crédits
            </button>
          </div>

          {/* Controls */}
          <PlayerControls />

          {/* Time + Volume */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs tabular-nums" style={{ color: "var(--color-texte-secondaire)" }}>
              {formatTime(currentPosition)} / {formatTime(duration)}
            </span>
            <div className="hidden md:flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--color-texte-secondaire)">
                <path d="M2 5h3l4-3v12L5 9H2V5z" />
                <path d="M10 4.5a3.5 3.5 0 0 1 0 5M11.5 2.5a6 6 0 0 1 0 9" strokeWidth="1.2" stroke="var(--color-texte-secondaire)" fill="none" />
              </svg>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 h-1 accent-green-400"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
        {showCredits && credits.length > 0 && (
          <div
            className="mt-3 pt-3 px-1"
            style={{ borderTop: "1px solid var(--color-elevated)" }}
          >
            <TrackCredits credits={credits} />
          </div>
        )}
      </div>
    </div>
  );
});
