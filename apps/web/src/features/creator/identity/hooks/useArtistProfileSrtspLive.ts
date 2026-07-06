"use client";

import { useCallback } from "react";
import type { ArtistProfile } from "@sonafrik/types";
import { useCreatorService } from "../../hooks/useCreator";
import { useArtistProfileSrtspLiveQuery } from "./useArtistProfileSrtspLiveQuery";

export interface UseArtistProfileSrtspLiveParams {
  creatorId: string;
  userId?: string;
  initialData: ArtistProfile;
  enabled?: boolean;
}

/** Profil artiste — consommateur SRTSP officiel (Phase 3.7). */
export function useArtistProfileSrtspLive(params: UseArtistProfileSrtspLiveParams) {
  const creator = useCreatorService();

  const fetchProfile = useCallback(async (): Promise<ArtistProfile> => {
    const context = await creator.getCreatorContext();
    return context.artistProfile;
  }, [creator]);

  return useArtistProfileSrtspLiveQuery<ArtistProfile>({
    creatorId: params.creatorId,
    userId: params.userId,
    queryKey: `artist-profile:${params.creatorId}`,
    fetcher: fetchProfile,
    initialData: params.initialData,
    skipInitialFetch: true,
    enabled: params.enabled,
  });
}
