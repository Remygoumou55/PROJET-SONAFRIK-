"use client";

import { useCallback, useEffect, useState } from "react";
import { ldseCache } from "@/features/shared/ldse/cache";
import { useLdseEvent } from "@/features/shared/ldse/LdseProvider";
import {
  SOCIAL_LDSE_EVENTS,
  SOCIAL_LDSE_KEYS,
  type SocialLikeState,
} from "@/features/shared/ldse/social/social-ldse-config";
import { publishSocialLdseEvent } from "@/features/shared/ldse/social/publishSocialLdseEvent";
import { useSocialService } from "./useSocial";

export function useLike(trackId: string) {
  const social = useSocialService();
  const cacheKey = SOCIAL_LDSE_KEYS.like(trackId);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const applyState = useCallback((state: SocialLikeState) => {
    setIsLiked(state.isLiked);
    setLikeCount(state.likeCount);
    ldseCache.set(cacheKey, state, 60_000);
  }, [cacheKey]);

  useEffect(() => {
    if (!trackId) return;
    let cancelled = false;

    const cached = ldseCache.get<SocialLikeState>(cacheKey);
    if (cached) {
      applyState(cached);
    }

    Promise.all([social.isLiked({ trackId }), social.getLikeCount({ trackId })])
      .then(([liked, count]) => {
        if (!cancelled) applyState({ isLiked: liked, likeCount: count });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [trackId, social, cacheKey, applyState]);

  useLdseEvent(SOCIAL_LDSE_EVENTS.likeToggled, (event) => {
    if (event.payload?.trackId === trackId && event.payload?.state) {
      applyState(event.payload.state as SocialLikeState);
    }
  });

  const toggleLike = useCallback(async () => {
    if (isLoading || !trackId) return;
    setIsLoading(true);
    const prev: SocialLikeState = { isLiked, likeCount };
    const optimistic: SocialLikeState = {
      isLiked: !prev.isLiked,
      likeCount: prev.isLiked ? Math.max(prev.likeCount - 1, 0) : prev.likeCount + 1,
    };
    applyState(optimistic);

    try {
      const result = await social.toggleLike({ trackId });
      const confirmed: SocialLikeState = {
        isLiked: result,
        likeCount: result && !prev.isLiked
          ? prev.likeCount + 1
          : !result && prev.isLiked
            ? Math.max(prev.likeCount - 1, 0)
            : optimistic.likeCount,
      };
      applyState(confirmed);
      publishSocialLdseEvent(SOCIAL_LDSE_EVENTS.likeToggled, {
        trackId,
        state: confirmed,
      });
    } catch {
      applyState(prev);
    } finally {
      setIsLoading(false);
    }
  }, [trackId, isLiked, likeCount, isLoading, social, applyState]);

  return { isLiked, likeCount, toggleLike, isLoading };
}
