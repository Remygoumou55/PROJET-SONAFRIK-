"use client";

import { useCallback } from "react";
import {
  shouldRefreshListenerArtistIdentity,
  shouldRefreshListenerCatalog,
} from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchArtistPublicPageData,
  type ArtistPublicPageData,
  type ArtistPublicSort,
} from "../lib/fetchArtistPublicPageData";
import { useListenerSrtspLiveQuery } from "./useListenerSrtspLiveQuery";

export interface UseArtistPublicSrtspLiveParams {
  artistId: string;
  creatorId: string;
  sort: ArtistPublicSort;
  initialData: ArtistPublicPageData;
  enabled?: boolean;
}

/** Profil public artiste — consommateur SRTSP (Phase 3.8). */
export function useArtistPublicSrtspLive(params: UseArtistPublicSrtspLiveParams) {
  const fetchPage = useCallback(async (): Promise<ArtistPublicPageData> => {
    const data = await fetchArtistPublicPageData(
      getSupabaseBrowserClient(),
      params.artistId,
      params.sort,
    );
    if (!data) throw new Error("Artiste introuvable");
    return data;
  }, [params.artistId, params.sort]);

  const shouldInvalidate = useCallback(
    (event: SrtspEvent, scope: { creatorId?: string }) => {
      if (!scope.creatorId) return false;
      return (
        shouldRefreshListenerArtistIdentity(event, { creatorId: scope.creatorId }) ||
        shouldRefreshListenerCatalog(event, { creatorId: scope.creatorId })
      );
    },
    [],
  );

  return useListenerSrtspLiveQuery<ArtistPublicPageData>({
    queryKey: `listener-artist-public:${params.artistId}:${params.sort}`,
    fetcher: fetchPage,
    initialData: params.initialData,
    skipInitialFetch: true,
    enabled: params.enabled,
    scope: { creatorId: params.creatorId },
    shouldInvalidate,
  });
}
