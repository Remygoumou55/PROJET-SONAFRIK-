"use client";

import { memo } from "react";
import { usePlayer } from "../hooks/usePlayer";
import { PlayerControls } from "./PlayerControls";
import { PlayerProgressBar, formatTime } from "./PlayerProgressBar";
import { CoverImage } from "@/components/CoverImage";

export const WebPlayer = memo(function WebPlayer() {
  const { currentTrack, currentPosition, duration, setVolume, volume, seek } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div
      className="fixed left-0 right-0 z-50 px-4 py-3 bottom-16 md:bottom-0"
      style={{ backgroundColor: "#1A1A1A", borderTop: "1px solid #2A2A2A" }}
    >
      <div className="max-w-screen-xl mx-auto">
        <PlayerProgressBar currentPosition={currentPosition} duration={duration} onSeek={seek} />
        <div className="flex items-center gap-4 mt-3">
          {/* Track info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-md flex-shrink-0 relative overflow-hidden">
              <CoverImage coverPath={currentTrack.cover_url ?? null} alt={currentTrack.title} />
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "#FFFFFF" }}
              >
                {currentTrack.title}
              </p>
              {currentTrack.artist_name && (
                <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
                  {currentTrack.artist_name}
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          <PlayerControls />

          {/* Time + Volume */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs tabular-nums" style={{ color: "#A0A0A0" }}>
              {formatTime(currentPosition)} / {formatTime(duration)}
            </span>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="#A0A0A0">
                <path d="M2 5h3l4-3v12L5 9H2V5z" />
                <path d="M10 4.5a3.5 3.5 0 0 1 0 5M11.5 2.5a6 6 0 0 1 0 9" strokeWidth="1.2" stroke="#A0A0A0" fill="none" />
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
      </div>
    </div>
  );
});
