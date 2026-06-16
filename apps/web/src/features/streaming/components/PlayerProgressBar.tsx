"use client";

import { memo } from "react";
import { REAL_LISTEN_THRESHOLD_PERCENT } from "@sonafrik/types";
import { formatTime } from "@/lib/formatters";

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
  const isValidListen = percentage >= REAL_LISTEN_THRESHOLD_PERCENT;

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

      {/* Marqueur seuil écoute valide (90%) */}
      {duration > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${REAL_LISTEN_THRESHOLD_PERCENT}%`,
            width: "2px",
            height: "8px",
            top: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: isValidListen ? "#00D26A" : "#444444",
            borderRadius: "1px",
            transition: "background-color 0.3s",
          }}
          aria-hidden="true"
          title={isValidListen ? "Écoute comptabilisée ✓" : `Seuil à ${REAL_LISTEN_THRESHOLD_PERCENT}%`}
        />
      )}

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

export { formatTime } from "@/lib/formatters";
