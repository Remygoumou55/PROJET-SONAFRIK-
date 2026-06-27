"use client";

import type { FollowEntityType } from "@sonafrik/types";
import { useFollow } from "../hooks/useFollow";
import { formatCount } from "@/lib/utils";

interface Props {
  entityType: FollowEntityType;
  entityId: string;
  showCount?: boolean;
}

export function FollowButton({ entityType, entityId, showCount = false }: Props) {
  const { isFollowing, followerCount, toggleFollow, isLoading } = useFollow(entityType, entityId);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleFollow}
        disabled={isLoading}
        className="rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50"
        style={
          isFollowing
            ? { backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)", border: "1px solid var(--color-bordure)" }
            : { backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }
        }
      >
        {isLoading ? "…" : isFollowing ? "Suivi ✓" : "Suivre"}
      </button>
      {showCount && followerCount > 0 && (
        <span className="text-sm" style={{ color: "var(--color-texte-desactive)" }}>
          {formatCount(followerCount)} abonné{followerCount > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
