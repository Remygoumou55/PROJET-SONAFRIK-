"use client";

import { usePlayer } from "../hooks/usePlayer";

export function PlayerControls() {
  const { isPlaying, isLoading, pauseAndSave, resume, stop } = usePlayer();

  return (
    <div className="flex items-center gap-3">
      {isLoading ? (
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#00D26A", borderTopColor: "transparent" }}
        />
      ) : isPlaying ? (
        <button
          onClick={pauseAndSave}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "#00D26A" }}
          aria-label="Pause"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#0D0D0D">
            <rect x="3" y="2" width="3.5" height="12" rx="1" />
            <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
          </svg>
        </button>
      ) : (
        <button
          onClick={resume}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "#00D26A" }}
          aria-label="Lecture"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#0D0D0D">
            <path d="M4 2L14 8L4 14V2Z" />
          </svg>
        </button>
      )}
      <button
        onClick={stop}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        style={{ backgroundColor: "#2A2A2A" }}
        aria-label="Arrêter"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="#A0A0A0">
          <rect x="1" y="1" width="10" height="10" rx="1" />
        </svg>
      </button>
    </div>
  );
}
