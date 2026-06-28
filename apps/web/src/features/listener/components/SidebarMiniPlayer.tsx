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
    <div className="ls-mini-player" aria-label="Lecture en cours">
      <div className="ls-mp-track">
        <div className="ls-mp-cover">
          <CoverImage
            coverPath={currentTrack.cover_url}
            alt={currentTrack.title}
            artistName={currentTrack.artist_name}
            imgSizes="38px"
          />
        </div>
        <div className="ls-mp-meta">
          <p className="ls-mp-title">{currentTrack.title}</p>
          <p className="ls-mp-artist">{currentTrack.artist_name ?? "Artiste"}</p>
        </div>
      </div>

      <div className="ls-mp-controls">
        <button type="button" className="ls-mp-btn" onClick={() => void playPrev()} aria-label="Précédent">
          ⏮
        </button>
        <button
          type="button"
          className="ls-mp-btn ls-mp-btn-play"
          onClick={handleToggle}
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button type="button" className="ls-mp-btn" onClick={() => void playNext()} aria-label="Suivant">
          ⏭
        </button>
      </div>
    </div>
  );
}
