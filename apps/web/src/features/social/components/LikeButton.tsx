"use client";

import { useLike } from "../hooks/useLike";
import { formatCount } from "@/lib/utils";

interface Props {
  trackId: string;
  showCount?: boolean;
  size?: "sm" | "md";
}

export function LikeButton({ trackId, showCount = false, size = "md" }: Props) {
  const { isLiked, likeCount, toggleLike, isLoading } = useLike(trackId);

  const iconSize = size === "sm" ? 14 : 18;

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading}
      aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isLiked}
      className="flex items-center gap-1.5 rounded-lg transition-opacity disabled:opacity-50"
      style={{ color: isLiked ? "#00D26A" : "#A0A0A0" }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showCount && likeCount > 0 && (
        <span className="text-xs tabular-nums">{formatCount(likeCount)}</span>
      )}
    </button>
  );
}
