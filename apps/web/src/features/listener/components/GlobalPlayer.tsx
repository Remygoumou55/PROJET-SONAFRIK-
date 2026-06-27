"use client";

import { memo, useEffect, useState } from "react";
import { usePlayer } from "../hooks/usePlayer";
import { usePlayerContext, usePlayerPosition } from "../lib/playerContext";
import { useStreamQuality } from "../hooks/useStreamQuality";
import { PlayerControls } from "./PlayerControls";
import { PlayerProgressBar, formatTime } from "./PlayerProgressBar";
import { PlayerExpandedPanel } from "./PlayerExpandedPanel";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/features/shared/social/components/LikeButton";

function GlobalPlayerProgress() {
  const { duration, seek } = usePlayer();
  const currentPosition = usePlayerPosition();
  const progress = duration > 0 ? (currentPosition / duration) * 100 : 0;

  return (
    <div
      className="gp-progress-track"
      role="slider"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progression du morceau"
    >
      <PlayerProgressBar currentPosition={currentPosition} duration={duration} onSeek={seek} />
    </div>
  );
}

function GlobalPlayerTime() {
  const { duration } = usePlayer();
  const currentPosition = usePlayerPosition();

  return (
    <span className="gp-time">
      {formatTime(currentPosition)} / {formatTime(duration)}
    </span>
  );
}

function GlobalPlayerVolume() {
  const { volume, setVolume } = usePlayerContext();

  return (
    <div className="gp-volume">
      <span className="gp-volume-icon" aria-hidden="true">
        🔊
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="gp-volume-slider"
        aria-label="Volume"
      />
    </div>
  );
}

export const GlobalPlayer = memo(function GlobalPlayer() {
  const { currentTrack, audioError, clearAudioError } = usePlayer();
  const { qualityLevel } = useStreamQuality();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.playerActive = currentTrack ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.playerActive;
    };
  }, [currentTrack]);

  useEffect(() => {
    if (!currentTrack) setIsExpanded(false);
  }, [currentTrack]);

  if (!currentTrack) return null;

  const artistLabel = currentTrack.artist_name ?? currentTrack.title;

  return (
    <>
      {isExpanded ? (
        <PlayerExpandedPanel track={currentTrack} onClose={() => setIsExpanded(false)} />
      ) : null}

      <div className="global-player" role="region" aria-label="Lecteur musical SONAFRIK">
      <GlobalPlayerProgress />

      {audioError ? (
        <div className="gp-error-banner">
          <span>{audioError}</span>
          <button type="button" onClick={clearAudioError} aria-label="Fermer l'erreur">
            ✕
          </button>
        </div>
      ) : null}

      <div className="gp-body">
        <div className="gp-track-info">
          <button
            type="button"
            className="gp-cover-btn"
            onClick={() => setIsExpanded(true)}
            aria-label="Ouvrir le lecteur étendu"
          >
            <div className="gp-cover">
              <CoverImage
                coverPath={currentTrack.cover_url ?? null}
                alt={currentTrack.title}
                artistName={artistLabel}
                imgSizes="48px"
              />
            </div>
          </button>
          <div className="gp-meta">
            <p className="gp-title">{currentTrack.title}</p>
            <p className="gp-artist">{currentTrack.artist_name ?? "Artiste"}</p>
          </div>
          <LikeButton trackId={currentTrack.id} size="sm" />
        </div>

        <div className="gp-controls">
          <PlayerControls />
          <GlobalPlayerTime />
        </div>

        <div className="gp-actions">
          {qualityLevel !== "standard" ? (
            <span className="gp-quality-badge">
              {qualityLevel === "ultra_economique" ? "Ultra-éco" : "Éco données"}
            </span>
          ) : null}
          <GlobalPlayerVolume />
        </div>
      </div>
      </div>
    </>
  );
});
