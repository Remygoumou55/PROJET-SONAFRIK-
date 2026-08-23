import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { Avatar } from "./Avatar";

export interface TrackCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  artist: string;
  coverUrl?: string;
  duration?: string;
  isPlaying?: boolean;
  index?: number;
  onPlay?: () => void;
}

export function TrackCard({
  className,
  title,
  artist,
  coverUrl,
  duration,
  isPlaying = false,
  index,
  onPlay,
  ...props
}: TrackCardProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg p-2 md:gap-4 md:p-3",
        "transition-all duration-300 ease-in-out",
        "hover:bg-[var(--t8-surface-03)] focus-within:bg-[var(--t8-surface-03)]",
        isPlaying && "bg-[var(--t8-surface-03)] border-l-2 border-[var(--t8-audio-cyan)]",
        className,
      )}
      {...props}
    >
      <div className="flex w-8 shrink-0 items-center justify-center text-sm text-[var(--t8-silver-deep)]">
        {isPlaying ? (
          <span className="text-[var(--t8-audio-cyan)]" aria-label="En lecture">
            <EqualizerIcon />
          </span>
        ) : (
          <span className="group-hover:hidden">{index ?? "—"}</span>
        )}
        {onPlay && !isPlaying ? (
          <button
            type="button"
            onClick={onPlay}
            className="hidden h-8 w-8 items-center justify-center rounded-full text-[var(--t8-audio-cyan)] group-hover:flex focus-visible:flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--t8-audio-cyan)]"
            aria-label={`Lire ${title}`}
          >
            <PlayIcon />
          </button>
        ) : null}
      </div>
      <Avatar src={coverUrl} alt={title} size="md" fallback={title.charAt(0) || "?"} />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium", isPlaying ? "text-[var(--t8-audio-cyan)]" : "text-[var(--t8-pearl)]")}>
          {title}
        </p>
        <p className="truncate text-sm text-[var(--t8-silver)]">{artist}</p>
      </div>
      {duration ? (
        <span className="shrink-0 text-sm tabular-nums text-[var(--t8-silver)]">{duration}</span>
      ) : null}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function EqualizerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="10" width="3" height="10" className="animate-pulse" />
      <rect x="10" y="6" width="3" height="14" className="animate-pulse" style={{ animationDelay: "150ms" }} />
      <rect x="16" y="8" width="3" height="12" className="animate-pulse" style={{ animationDelay: "300ms" }} />
    </svg>
  );
}
