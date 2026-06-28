"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, useState } from "react";
import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/features/shared/social/components/LikeButton";
import { usePlayer } from "../hooks/usePlayer";
import { usePlayerContext, usePlayerPosition } from "../lib/playerContext";
import { usePlayerMute, volumeIcon } from "../lib/playerMuteContext";
import { useListenFeatures } from "../lib/listenFeaturesContext";
import { PlayerControls } from "./PlayerControls";
import { PlayerProgressBar, formatTime } from "./PlayerProgressBar";
import { TipPanel } from "./TipPanel";

const LiveReactions = dynamic(
  () => import("./LiveReactions").then((m) => ({ default: m.LiveReactions })),
  { ssr: false },
);

const QueuePanel = dynamic(
  () => import("./QueuePanel").then((m) => ({ default: m.QueuePanel })),
  { ssr: false },
);

const ShareButton = dynamic(
  () => import("./ShareButton").then((m) => ({ default: m.ShareButton })),
  { ssr: false },
);

type FullPlayerTab = "main" | "reactions" | "soutenir";

interface FullPlayerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function FullPlayerProgress() {
  const { duration, seek } = usePlayer();
  const currentPosition = usePlayerPosition();

  return (
    <div className="fpp-progress-section">
      <div
        className="fpp-progress-track"
        role="slider"
        aria-label="Progression du morceau"
        aria-valuenow={Math.floor(currentPosition)}
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration)}
        tabIndex={0}
      >
        <PlayerProgressBar currentPosition={currentPosition} duration={duration} onSeek={seek} />
      </div>
      <div className="fpp-time-row">
        <span>{formatTime(currentPosition)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

function QueueOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fpp-queue-overlay" onClick={onClose} role="presentation">
      <div
        className="fpp-queue-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="File d'attente"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fpp-queue-header">
          <h3>File d&apos;attente</h3>
          <button type="button" className="fpp-close" onClick={onClose} aria-label="Fermer la file">
            ✕
          </button>
        </div>
        <QueuePanel />
      </div>
    </div>
  );
}

export const FullPlayerPanel = memo(function FullPlayerPanel({
  isOpen,
  onClose,
}: FullPlayerPanelProps) {
  const { currentTrack, isPlaying, pauseAndSave, resume } = usePlayer();
  const { volume } = usePlayerContext();
  const { isMuted, toggleMute, handleVolumeChange } = usePlayerMute();
  const { whatsappShare } = useListenFeatures();
  const [activeTab, setActiveTab] = useState<FullPlayerTab>("main");
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === " ") {
        event.preventDefault();
        if (isPlaying) void pauseAndSave();
        else resume();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, isPlaying, pauseAndSave, resume]);

  useEffect(() => {
    if (!isOpen) {
      setIsQueueOpen(false);
      setActiveTab("main");
    }
  }, [isOpen]);

  if (!isOpen || !currentTrack) return null;

  const artistLabel = currentTrack.artist_name ?? "Artiste";

  return (
    <>
      <div className="fpp-overlay" onClick={onClose} aria-hidden="true" />

      <div
        className="fpp-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Lecteur — ${currentTrack.title}`}
      >
        <div className="fpp-bg" aria-hidden="true" />

        <div className="fpp-top-bar">
          <div className="fpp-handle" aria-hidden="true" />
          <button type="button" className="fpp-close" onClick={onClose} aria-label="Fermer le lecteur">
            ✕
          </button>
        </div>

        <div className="fpp-cover-wrap">
          <div className={`fpp-cover${isPlaying ? " fpp-cover--playing" : ""}`}>
            <CoverImage
              coverPath={currentTrack.cover_url ?? null}
              alt={currentTrack.title}
              artistName={artistLabel}
              imgSizes="280px"
              priority
            />
          </div>
        </div>

        <div className="fpp-track-info">
          <div className="fpp-track-meta">
            <h2 className="fpp-title">{currentTrack.title}</h2>
            <p className="fpp-artist">{artistLabel}</p>
          </div>
          <LikeButton trackId={currentTrack.id} size="md" />
        </div>

        <FullPlayerProgress />

        <div className="fpp-controls">
          <PlayerControls />
        </div>

        <div className="fpp-volume-row">
          <button
            type="button"
            className={`fpp-vol-mute${isMuted ? " muted" : ""}`}
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
            step={0.02}
            value={isMuted ? 0 : volume}
            onChange={(event) => handleVolumeChange(Number(event.target.value))}
            className="fpp-vol-slider"
            aria-label="Volume"
          />
        </div>

        <div className="fpp-tabs" role="tablist" aria-label="Sections du lecteur">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "main"}
            className={`fpp-tab${activeTab === "main" ? " active" : ""}`}
            onClick={() => setActiveTab("main")}
          >
            Actions
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reactions"}
            className={`fpp-tab${activeTab === "reactions" ? " active" : ""}`}
            onClick={() => setActiveTab("reactions")}
          >
            Réactions
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "soutenir"}
            className={`fpp-tab fpp-tab--soutenir${activeTab === "soutenir" ? " active" : ""}`}
            onClick={() => setActiveTab("soutenir")}
          >
            💛 Soutenir
          </button>
        </div>

        {activeTab === "main" ? (
          <div className="fpp-actions-grid" role="tabpanel" aria-label="Actions">
            {whatsappShare ? (
              <div className="fpp-action-share">
                <ShareButton
                  trackId={currentTrack.id}
                  title={currentTrack.title}
                  artistName={artistLabel}
                  variant="full"
                />
              </div>
            ) : null}
            <button
              type="button"
              className="fpp-action-btn"
              onClick={() => setIsQueueOpen(true)}
              aria-label="File d'attente"
            >
              <span className="fpp-action-icon" aria-hidden="true">
                ☰
              </span>
              <span className="fpp-action-label">File</span>
            </button>
            <button type="button" className="fpp-action-btn" aria-label="Écouter hors ligne" disabled>
              <span className="fpp-action-icon" aria-hidden="true">
                ⬇
              </span>
              <span className="fpp-action-label">Hors ligne</span>
            </button>
            <button type="button" className="fpp-action-btn" aria-label="Voir les paroles" disabled>
              <span className="fpp-action-icon" aria-hidden="true">
                📝
              </span>
              <span className="fpp-action-label">Paroles</span>
            </button>
          </div>
        ) : null}

        {activeTab === "reactions" ? (
          <div className="fpp-reactions-panel" role="tabpanel" aria-label="Réactions">
            <p className="fpp-reactions-intro">Comment ce morceau te fait-il sentir ?</p>
            <LiveReactions />
          </div>
        ) : null}

        {activeTab === "soutenir" ? (
          <div className="fpp-tip-panel" role="tabpanel" aria-label="Soutenir l'artiste">
            <TipPanel creatorId={currentTrack.creator_id} artistName={artistLabel} variant="full" />
            <p className="fpp-tip-note">
              Le pourboire est envoyé directement à l&apos;artiste depuis votre wallet SONAFRIK.{" "}
              <Link href="/wallet" className="fpp-tip-wallet-link">
                Voir mon wallet
              </Link>
            </p>
          </div>
        ) : null}
      </div>

      <QueueOverlay isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </>
  );
});
