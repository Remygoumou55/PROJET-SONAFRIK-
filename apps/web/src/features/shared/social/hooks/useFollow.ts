"use client";

import { useCallback, useEffect, useState } from "react";
import type { FollowEntityType } from "@sonafrik/types";
import { ldseCache } from "@/features/shared/ldse/cache";
import { useLdseEvent } from "@/features/shared/ldse/LdseProvider";
import {
  SOCIAL_LDSE_EVENTS,
  SOCIAL_LDSE_KEYS,
  type SocialFollowState,
} from "@/features/shared/ldse/social/social-ldse-config";
import { publishSocialLdseEvent } from "@/features/shared/ldse/social/publishSocialLdseEvent";
import { useSocialService } from "./useSocial";

export function useFollow(entityType: FollowEntityType, entityId: string) {
  const social = useSocialService();
  const cacheKey = SOCIAL_LDSE_KEYS.follow(entityType, entityId);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const applyState = useCallback((state: SocialFollowState) => {
    setIsFollowing(state.isFollowing);
    setFollowerCount(state.followerCount);
    ldseCache.set(cacheKey, state, 60_000);
  }, [cacheKey]);

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;

    const cached = ldseCache.get<SocialFollowState>(cacheKey);
    if (cached) applyState(cached);

    Promise.all([
      social.isFollowing({ entityType, entityId }),
      social.getFollowCount({ entityType, entityId }),
    ])
      .then(([following, count]) => {
        if (!cancelled) applyState({ isFollowing: following, followerCount: count });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [entityType, entityId, social, cacheKey, applyState]);

  useLdseEvent(SOCIAL_LDSE_EVENTS.followToggled, (event) => {
    if (
      event.payload?.entityType === entityType &&
      event.payload?.entityId === entityId &&
      event.payload?.state
    ) {
      applyState(event.payload.state as SocialFollowState);
    }
  });

  const toggleFollow = useCallback(async () => {
    if (isLoading || !entityId) return;
    setIsLoading(true);
    const prev: SocialFollowState = { isFollowing, followerCount };
    const optimistic: SocialFollowState = {
      isFollowing: !prev.isFollowing,
      followerCount: prev.isFollowing
        ? Math.max(prev.followerCount - 1, 0)
        : prev.followerCount + 1,
    };
    applyState(optimistic);

    try {
      const result = await social.toggleFollow({ entityType, entityId });
      const confirmed: SocialFollowState = {
        isFollowing: result,
        followerCount: result && !prev.isFollowing
          ? prev.followerCount + 1
          : !result && prev.isFollowing
            ? Math.max(prev.followerCount - 1, 0)
            : optimistic.followerCount,
      };
      applyState(confirmed);
      publishSocialLdseEvent(SOCIAL_LDSE_EVENTS.followToggled, {
        entityType,
        entityId,
        state: confirmed,
      });
    } catch {
      applyState(prev);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, isFollowing, followerCount, isLoading, social, applyState]);

  return { isFollowing, followerCount, toggleFollow, isLoading };
}
