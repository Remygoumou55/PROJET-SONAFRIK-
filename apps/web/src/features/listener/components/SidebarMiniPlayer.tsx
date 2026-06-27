"use client";

import { CoverImage } from "@/components/CoverImage";
import { usePlayerContext } from "../lib/playerContext";
import { usePlayer } from "../hooks/usePlayer";

export function SidebarMiniPlayer() {
  const player = usePlayerContext();
  const { currentTrack, isPlaying, resume } = player;
  const { pauseAndSave, playNext, playPrev } = usePlayer();

  if (!currentTrack) return null;

  const handleToggle = () => {
    if (isPlaying) {
      void pauseAndSave();
    } else {
      resume();
    }
  };

  return (
    <div className="sidebar-mini-player" aria-label="Lecture en cours">
      <div className="smp-track-info">
        <div className="smp-cover">
          <CoverImage
            coverPath={currentTrack.cover_url}
            alt={currentTrack.title}
            artistName={currentTrack.artist_name}
            imgSizes="40px"
          />
        </div>
        <div className="smp-meta">
          <p className="smp-title">{currentTrack.title}</p>
          <p className="smp-artist">{currentTrack.artist_name ?? "Artiste"}</p>
        </div>
      </div>

      <div className="smp-controls">
        <button type="button" className="smp-btn" onClick={() => void playPrev()} aria-label="Précédent">
          ⏮
        </button>
        <button
          type="button"
          className="smp-btn smp-btn-play"
          onClick={handleToggle}
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button type="button" className="smp-btn" onClick={() => void playNext()} aria-label="Suivant">
          ⏭
        </button>
      </div>
    </div>
  );
}
