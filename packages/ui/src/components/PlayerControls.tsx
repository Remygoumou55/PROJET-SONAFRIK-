/**
 * PlayerControls — REAL LISTEN V7.2
 * Barre de progression intégrée NON CLIQUABLE (via ProgressBar).
 */

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { ProgressBar } from "./ProgressBar";

export interface PlayerControlsProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  artist: string;
  coverUrl?: string;
  isPlaying?: boolean;
  progress: number;
  currentTime?: string;
  totalTime?: string;
  onPlayPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onShuffle?: () => void;
  onRepeat?: () => void;
}

export function PlayerControls({
  className,
  title,
  artist,
  coverUrl,
  isPlaying = false,
  progress,
  currentTime = "0:00",
  totalTime = "0:00",
  onPlayPause,
  onPrevious,
  onNext,
  onShuffle,
  onRepeat,
  ...props
}: PlayerControlsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-[var(--t8-border-default)] bg-[var(--t8-surface-02)] p-4 md:flex-row md:items-center md:gap-6",
        className,
      )}
      role="group"
      aria-label={`Lecteur — ${title} par ${artist}`}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-md object-cover md:h-14 md:w-14"
            aria-hidden="true"
          />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-md bg-[var(--t8-surface-03)] md:h-14 md:w-14" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--t8-pearl)]">{title}</p>
          <p className="truncate text-sm text-[var(--t8-silver)]">{artist}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 md:flex-1">
        <div className="flex items-center gap-2 md:gap-4">
          {onShuffle ? (
            <ControlButton label="Lecture aléatoire" onClick={onShuffle}>
              <ShuffleIcon />
            </ControlButton>
          ) : null}
          {onPrevious ? (
            <ControlButton label="Titre précédent" onClick={onPrevious}>
              <PrevIcon />
            </ControlButton>
          ) : null}
          {onPlayPause ? (
            <button
              type="button"
              onClick={onPlayPause}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--t8-primary-lavender)] text-[var(--t8-pearl)] transition-transform duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--t8-primary-lavender)]"
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          ) : null}
          {onNext ? (
            <ControlButton label="Titre suivant" onClick={onNext}>
              <NextIcon />
            </ControlButton>
          ) : null}
          {onRepeat ? (
            <ControlButton label="Répéter" onClick={onRepeat}>
              <RepeatIcon />
            </ControlButton>
          ) : null}
        </div>
        <div className="flex w-full max-w-md items-center gap-2">
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-[var(--t8-silver)]">
            {currentTime}
          </span>
          <ProgressBar
            value={progress}
            label={`Progression — ${title}`}
            className="flex-1"
          />
          <span className="w-10 shrink-0 text-xs tabular-nums text-[var(--t8-silver)]">
            {totalTime}
          </span>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--t8-silver)] transition-colors duration-300 hover:text-[var(--t8-pearl)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--t8-primary-lavender)]"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
