/**
 * ProgressBar — REAL LISTEN V7.2
 * Barre NON CLIQUABLE · cursor:default · pointer-events:none
 * Aucune interaction utilisateur sur la progression.
 */

import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Valeur 0–100 */
  value: number;
  label?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "premium";
}

const sizeClasses = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2",
} as const;

export function ProgressBar({
  className,
  value,
  label = "Progression de lecture",
  showLabel = false,
  size = "md",
  variant = "default",
  ...props
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {showLabel ? (
        <div className="mb-1 flex justify-between text-xs text-[var(--t8-silver)]">
          <span>{label}</span>
          <span aria-hidden="true">{Math.round(clamped)}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "pointer-events-none cursor-default select-none overflow-hidden rounded-full bg-[var(--t8-surface-03)]",
          sizeClasses[size],
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-in-out",
            variant === "premium" ? "bg-[var(--t8-primary-lavender)]" : "bg-[var(--t8-audio-cyan)]",
          )}
          style={{ width: `${clamped}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
