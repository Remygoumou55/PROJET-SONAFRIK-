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
            ? { backgroundColor: "#2A2A2A", color: "#A0A0A0", border: "1px solid #333333" }
            : { backgroundColor: "#00D26A", color: "#0D0D0D" }
        }
      >
        {isLoading ? "…" : isFollowing ? "Suivi ✓" : "Suivre"}
      </button>
      {showCount && followerCount > 0 && (
        <span className="text-sm" style={{ color: "#555555" }}>
          {formatCount(followerCount)} abonné{followerCount > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
