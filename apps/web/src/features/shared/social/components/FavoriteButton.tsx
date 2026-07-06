"use client";

import type { FavoriteEntityType } from "@sonafrik/types";
import { useFavorite } from "../hooks/useFavorite";

interface Props {
  entityType: FavoriteEntityType;
  entityId: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ entityType, entityId, size = "md" }: Props) {
  const { isFavorited, toggleFavorite, isLoading } = useFavorite(
    entityType === "album" ? "album" : "track",
    entityId,
  );

  const iconSize = size === "sm" ? 14 : 18;

  return (
    <button
      type="button"
      onClick={() => void toggleFavorite()}
      disabled={isLoading}
      aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isFavorited}
      className="flex items-center gap-1.5 rounded-lg transition-opacity disabled:opacity-50"
      style={{ color: isFavorited ? "var(--color-or-solaire)" : "var(--color-texte-secondaire)" }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    </button>
  );
}
