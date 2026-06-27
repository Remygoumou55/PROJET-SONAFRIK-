"use client";

import { useEffect } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import { CoverImage } from "@/components/CoverImage";
import { usePlayer } from "../hooks/usePlayer";
import { usePlayerPosition } from "../lib/playerContext";
import { PlayerControls } from "./PlayerControls";
import { PlayerProgressBar, formatTime } from "./PlayerProgressBar";
import { LiveReactions } from "./LiveReactions";

interface PlayerExpandedPanelProps {
  track: TrackWithMeta;
  onClose: () => void;
}

function ExpandedProgress() {
  const { duration, seek } = usePlayer();
  const currentPosition = usePlayerPosition();

  return (
    <div className="pep-progress-wrap">
      <div className="pep-progress-track">
        <PlayerProgressBar currentPosition={currentPosition} duration={duration} onSeek={seek} />
      </div>
      <div className="pep-time-row">
        <span>{formatTime(currentPosition)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export function PlayerExpandedPanel({ track, onClose }: PlayerExpandedPanelProps) {
  const artistLabel = track.artist_name ?? track.title;

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

  return (
    <div
      className="player-expanded-overlay"
      onClick={onClose}
      role="dialog"
      aria-label="Lecteur musical étendu"
      aria-modal="true"
    >
      <div className="player-expanded-panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="pep-close" onClick={onClose} aria-label="Fermer le lecteur étendu">
          ✕
        </button>

        <div className="pep-cover">
          <CoverImage
            coverPath={track.cover_url ?? null}
            alt={track.title}
            artistName={artistLabel}
            imgSizes="240px"
          />
        </div>

        <div className="pep-meta">
          <h3 className="pep-title">{track.title}</h3>
          <p className="pep-artist">{track.artist_name ?? "Artiste"}</p>
        </div>

        <ExpandedProgress />

        <div className="pep-controls">
          <PlayerControls />
        </div>

        <div className="pep-reactions-section">
          <p className="pep-reactions-label">Comment tu te sens ?</p>
          <LiveReactions />
        </div>
      </div>
    </div>
  );
}
