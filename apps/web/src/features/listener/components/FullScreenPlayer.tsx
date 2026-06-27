"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { CoverImage } from "@/components/CoverImage";
import { usePlayer } from "../hooks/usePlayer";
import { usePlayerContext, usePlayerPosition } from "../lib/playerContext";
import { useListenFeatures } from "../lib/listenFeaturesContext";
import { PlayerControls } from "./PlayerControls";
import { PlayerProgressBar, formatTime } from "./PlayerProgressBar";
import { ShareButton } from "./ShareButton";

const LiveReactions = dynamic(
  () => import("./LiveReactions").then((m) => ({ default: m.LiveReactions })),
  { ssr: false },
);

const QueuePanel = dynamic(
  () => import("./QueuePanel").then((m) => ({ default: m.QueuePanel })),
  { ssr: false },
);

const LyricsPanel = dynamic(
  () => import("./LyricsPanel").then((m) => ({ default: m.LyricsPanel })),
  { ssr: false },
);

type FullScreenTab = "now-playing" | "queue" | "lyrics";

interface FullScreenPlayerProps {
  onClose: () => void;
}

function FullScreenProgress() {
  const { duration, seek } = usePlayer();
  const currentPosition = usePlayerPosition();
  const progress = duration > 0 ? (currentPosition / duration) * 100 : 0;

  return (
    <div className="fs-progress-section">
      <div
        className="fs-progress-track"
        role="slider"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression du morceau"
      >
        <PlayerProgressBar currentPosition={currentPosition} duration={duration} onSeek={seek} />
      </div>
      <div className="fs-time-row">
        <span>{formatTime(currentPosition)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

function AudioVisualizer({ active }: { active: boolean }) {
  return (
    <div className={`fs-visualizer${active ? " fs-visualizer--active" : ""}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((bar) => (
        <span key={bar} className="fs-visualizer-bar" style={{ animationDelay: `${bar * 0.12}s` }} />
      ))}
    </div>
  );
}

export function FullScreenPlayer({ onClose }: FullScreenPlayerProps) {
  const { currentTrack, isPlaying } = usePlayer();
  const { volume, setVolume } = usePlayerContext();
  const currentPosition = usePlayerPosition();
  const features = useListenFeatures();
  const [activeTab, setActiveTab] = useState<FullScreenTab>("now-playing");

  const tabs = useMemo(() => {
    const items: { key: FullScreenTab; label: string }[] = [{ key: "now-playing", label: "Lecture" }];
    if (features.queuePanel) items.push({ key: "queue", label: "File d'attente" });
    if (features.synchronizedLyrics) items.push({ key: "lyrics", label: "Paroles" });
    return items;
  }, [features.queuePanel, features.synchronizedLyrics]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab("now-playing");
    }
  }, [activeTab, tabs]);

  if (!currentTrack) return null;

  const artistLabel = currentTrack.artist_name ?? "Artiste";

  return (
    <div className="fs-player" role="dialog" aria-label="Lecteur plein écran" aria-modal="true">
      <div className="fs-backdrop">
        <div className="fs-backdrop-img">
          <CoverImage
            coverPath={currentTrack.cover_url ?? null}
            alt=""
            artistName={artistLabel}
            imgSizes="100vw"
          />
        </div>
        <div className="fs-backdrop-overlay" />
      </div>

      <div className="fs-header">
        <button type="button" className="fs-close-btn" onClick={onClose} aria-label="Réduire le lecteur">
          ⌄
        </button>
        <div className="fs-context">
          <span className="fs-context-label">En cours de lecture</span>
        </div>
        <span className="fs-more-btn" aria-hidden="true">
          ⋯
        </span>
      </div>

      {tabs.length > 1 ? (
        <div className="fs-tabs" role="tablist" aria-label="Sections du lecteur">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`fs-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="fs-content">
        {activeTab === "now-playing" ? (
          <div className="fs-now-playing">
            <div className={`fs-cover-wrap${isPlaying ? " rotating" : ""}`}>
              <div className="fs-cover-img">
                <CoverImage
                  coverPath={currentTrack.cover_url ?? null}
                  alt={currentTrack.title}
                  artistName={artistLabel}
                  imgSizes="280px"
                  priority
                />
              </div>
              <div className="fs-cover-halo" />
            </div>

            <AudioVisualizer active={isPlaying} />

            <div className="fs-track-meta">
              <h1 className="fs-title">{currentTrack.title}</h1>
              <p className="fs-artist">{artistLabel}</p>
            </div>

            <div className="fs-quick-actions">
              {features.whatsappShare ? (
                <ShareButton
                  trackId={currentTrack.id}
                  title={currentTrack.title}
                  artistName={artistLabel}
                  variant="full"
                />
              ) : null}
            </div>

            <FullScreenProgress />

            <div className="fs-controls">
              <PlayerControls />
            </div>

            <div className="fs-volume">
              <span className="fs-vol-icon" aria-hidden="true">
                🔈
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="fs-volume-slider"
                aria-label="Volume"
              />
              <span className="fs-vol-icon" aria-hidden="true">
                🔊
              </span>
            </div>

            <LiveReactions />
          </div>
        ) : null}

        {activeTab === "queue" && features.queuePanel ? <QueuePanel /> : null}

        {activeTab === "lyrics" && features.synchronizedLyrics ? (
          <LyricsPanel trackId={currentTrack.id} currentTime={currentPosition} />
        ) : null}
      </div>
    </div>
  );
}
