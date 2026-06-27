"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocialService } from "./useSocial";

export function useLike(trackId: string) {
  const social = useSocialService();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!trackId) return;
    let cancelled = false;

    Promise.all([
      social.isLiked({ trackId }),
      social.getLikeCount({ trackId }),
    ])
      .then(([liked, count]) => {
        if (!cancelled) {
          setIsLiked(liked);
          setLikeCount(count);
        }
      })
      .catch((err: unknown) => { console.error("[Social] Chargement like échoué", err); });

    return () => { cancelled = true; };
  }, [trackId, social]);

  const toggleLike = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    // Optimistic update
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(prevCount - 1, 0) : prevCount + 1);

    try {
      const result = await social.toggleLike({ trackId });
      setIsLiked(result);
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsLoading(false);
    }
  }, [trackId, isLiked, likeCount, isLoading, social]);

  return { isLiked, likeCount, toggleLike, isLoading };
}
