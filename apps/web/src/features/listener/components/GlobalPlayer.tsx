"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, useState } from "react";
import { usePlayer } from "../hooks/usePlayer";
import { usePlayerContext, usePlayerPosition } from "../lib/playerContext";
import { usePlayerMute, volumeIcon } from "../lib/playerMuteContext";
import { useListenFeatures } from "../lib/listenFeaturesContext";
import { useStreamQuality } from "../hooks/useStreamQuality";
import { PlayerControls } from "./PlayerControls";
import { PlayerProgressBar, formatTime } from "./PlayerProgressBar";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/features/shared/social/components/LikeButton";

const ShareButton = dynamic(
  () => import("./ShareButton").then((m) => ({ default: m.ShareButton })),
  { ssr: false },
);

const FullPlayerPanel = dynamic(
  () => import("./FullPlayerPanel").then((m) => ({ default: m.FullPlayerPanel })),
  { ssr: false },
);

const FullScreenPlayer = dynamic(
  () => import("./FullScreenPlayer").then((m) => ({ default: m.FullScreenPlayer })),
  { ssr: false, loading: () => <div className="fs-loading">Chargement...</div> },
);

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
  const { volume } = usePlayerContext();
  const { isMuted, toggleMute, handleVolumeChange } = usePlayerMute();

  return (
    <div className="gp-volume">
      <button
        type="button"
        className={`gp-volume-icon-btn${isMuted ? " muted" : ""}`}
        onClick={toggleMute}
        aria-label={isMuted ? "Activer le son" : "Couper le son"}
        aria-pressed={isMuted}
      >
        {volumeIcon(isMuted, volume)}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={isMuted ? 0 : volume}
        onChange={(e) => handleVolumeChange(Number(e.target.value))}
        className="gp-volume-slider"
        aria-label="Volume"
      />
    </div>
  );
}

export const GlobalPlayer = memo(function GlobalPlayer() {
  const { currentTrack, audioError, clearAudioError } = usePlayer();
  const { qualityLevel } = useStreamQuality();
  const { fullscreenPlayer, whatsappShare } = useListenFeatures();
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.playerActive = currentTrack ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.playerActive;
    };
  }, [currentTrack]);

  useEffect(() => {
    if (!currentTrack) {
      setIsFullPlayerOpen(false);
      setIsFullScreen(false);
    }
  }, [currentTrack]);

  if (!currentTrack) return null;

  const artistLabel = currentTrack.artist_name ?? currentTrack.title;

  return (
    <>
      <FullPlayerPanel isOpen={isFullPlayerOpen} onClose={() => setIsFullPlayerOpen(false)} />

      {isFullScreen && fullscreenPlayer ? (
        <FullScreenPlayer onClose={() => setIsFullScreen(false)} />
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
              className="gp-track-clickable"
              onClick={() => setIsFullPlayerOpen(true)}
              aria-label={`Ouvrir le lecteur pour ${currentTrack.title}`}
            >
              <div className="gp-cover">
                <CoverImage
                  coverPath={currentTrack.cover_url ?? null}
                  alt={currentTrack.title}
                  artistName={artistLabel}
                  imgSizes="48px"
                />
              </div>
              <div className="gp-meta">
                <p className="gp-title">{currentTrack.title}</p>
                <p className="gp-artist">{currentTrack.artist_name ?? "Artiste"}</p>
              </div>
              <span className="gp-expand-hint" aria-hidden="true">
                ▲
              </span>
            </button>
            <LikeButton trackId={currentTrack.id} size="sm" />
            {whatsappShare ? (
              <ShareButton
                trackId={currentTrack.id}
                title={currentTrack.title}
                artistName={artistLabel}
              />
            ) : null}
          </div>

          <div className="gp-controls">
            {fullscreenPlayer ? (
              <button
                type="button"
                className="gp-expand-btn"
                onClick={() => setIsFullScreen(true)}
                aria-label="Ouvrir le lecteur plein écran"
              >
                ↑
              </button>
            ) : null}
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
