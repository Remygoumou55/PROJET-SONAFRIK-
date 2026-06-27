"use client";

import { useCallback, useEffect, useState } from "react";
import type { FollowEntityType } from "@sonafrik/types";
import { useSocialService } from "./useSocial";

export function useFollow(entityType: FollowEntityType, entityId: string) {
  const social = useSocialService();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;

    Promise.all([
      social.isFollowing({ entityType, entityId }),
      social.getFollowCount({ entityType, entityId }),
    ])
      .then(([following, count]) => {
        if (!cancelled) {
          setIsFollowing(following);
          setFollowerCount(count);
        }
      })
      .catch((err: unknown) => { console.error("[Social] Chargement follow échoué", err); });

    return () => { cancelled = true; };
  }, [entityType, entityId, social]);

  const toggleFollow = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    const prevFollowing = isFollowing;
    const prevCount = followerCount;
    setIsFollowing(!prevFollowing);
    setFollowerCount(prevFollowing ? Math.max(prevCount - 1, 0) : prevCount + 1);

    try {
      const result = await social.toggleFollow({ entityType, entityId });
      setIsFollowing(result);
    } catch {
      setIsFollowing(prevFollowing);
      setFollowerCount(prevCount);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, isFollowing, followerCount, isLoading, social]);

  return { isFollowing, followerCount, toggleFollow, isLoading };
}
