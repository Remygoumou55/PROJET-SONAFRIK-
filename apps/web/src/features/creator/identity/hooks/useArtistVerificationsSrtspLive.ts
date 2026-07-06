"use client";

import { useCallback } from "react";
import type { CreatorVerification } from "@sonafrik/types";
import { useCreatorService } from "../../hooks/useCreator";
import { useArtistProfileSrtspLiveQuery } from "./useArtistProfileSrtspLiveQuery";

export interface UseArtistVerificationsSrtspLiveParams {
  creatorId: string;
  userId?: string;
  initialData: CreatorVerification[];
  enabled?: boolean;
}

/** Vérifications artiste — consommateur SRTSP (Phase 3.7). */
export function useArtistVerificationsSrtspLive(params: UseArtistVerificationsSrtspLiveParams) {
  const creator = useCreatorService();

  const fetchVerifications = useCallback(async (): Promise<CreatorVerification[]> => {
    return creator.getVerifications();
  }, [creator]);

  return useArtistProfileSrtspLiveQuery<CreatorVerification[]>({
    creatorId: params.creatorId,
    userId: params.userId,
    queryKey: `artist-verifications:${params.creatorId}`,
    fetcher: fetchVerifications,
    initialData: params.initialData,
    skipInitialFetch: true,
    enabled: params.enabled,
  });
}
