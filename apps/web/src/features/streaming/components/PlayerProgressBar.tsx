"use client";

import { memo } from "react";

export const PlayerProgressBar = memo(function PlayerProgressBar({
  currentPosition,
  duration,
  onSeek,
}: {
  currentPosition: number;
  duration: number;
  onSeek?: (positionSeconds: number) => void;
}) {
  const percentage = duration > 0 ? Math.min((currentPosition / duration) * 100, 100) : 0;
  const isSeekable = !!onSeek && duration > 0;

  return (
    <div
      className="relative w-full h-4 flex items-center"
      style={{ cursor: isSeekable ? "pointer" : "default" }}
    >
      {/* Piste visuelle — décorative, pointer-events ignorés */}
      <div
        className="absolute inset-x-0 h-1 rounded-full overflow-hidden pointer-events-none"
        style={{ backgroundColor: "#333333" }}
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: "#00D26A" }}
        />
      </div>

      {/* Input range transparent — capte clics et drag, accessible */}
      {isSeekable ? (
        <input
          type="range"
          min={0}
          max={duration}
          step={0.5}
          value={currentPosition}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={`Progression : ${formatTime(currentPosition)} sur ${formatTime(duration)}`}
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuenow={Math.floor(currentPosition)}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full" aria-hidden="true" />
      )}
    </div>
  );
});

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
