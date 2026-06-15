"use client";

import { useEffect, useState } from "react";
import type { CreatorEngagementStats, EngagementStats } from "@sonafrik/types";
import { useSocialService } from "./useSocial";

const DEFAULT_STATS: EngagementStats = {
  like_count: 0,
  follow_count: 0,
  user_liked: false,
  user_favorited: false,
  user_following: false,
};

const DEFAULT_CREATOR_STATS: CreatorEngagementStats = {
  track_likes: 0,
  album_favorites: 0,
  artist_followers: 0,
  creator_followers: 0,
  playlist_followers: 0,
  total_engagement: 0,
};

export function useEngagementStats(entityType: string, entityId: string) {
  const social = useSocialService();
  const [stats, setStats] = useState<EngagementStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!entityId) { setIsLoading(false); return; }
    let cancelled = false;

    setIsLoading(true);
    social
      .getEngagementStats({ entityType: entityType as never, entityId })
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err: unknown) => { console.error("[Social] getEngagementStats échoué", err); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [entityType, entityId, social]);

  return { stats, isLoading };
}

export function useCreatorEngagementStats(creatorId: string) {
  const social = useSocialService();
  const [stats, setStats] = useState<CreatorEngagementStats>(DEFAULT_CREATOR_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!creatorId) { setIsLoading(false); return; }
    let cancelled = false;

    setIsLoading(true);
    social
      .getCreatorEngagementStats({ creatorId })
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err: unknown) => { console.error("[Social] getCreatorEngagementStats échoué", err); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [creatorId, social]);

  return { stats, isLoading };
}
