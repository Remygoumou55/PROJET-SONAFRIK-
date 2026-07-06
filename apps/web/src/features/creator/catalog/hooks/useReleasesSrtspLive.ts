"use client";

import { useCallback, useMemo } from "react";
import type { Album } from "@sonafrik/types";
import {
  getCreatorCatalogInvalidateEvents,
  shouldRefreshCreatorCatalog,
} from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useEventSubscription, useLiveQuery } from "@sonafrik/realtime/react";
import { useCatalogService } from "./useCatalog";

export interface UseReleasesSrtspLiveParams {
  creatorId: string;
  initialData: Album[];
  enabled?: boolean;
}

/** Catalogue Hub — liste sorties / albums (Phase 3.4). */
export function useReleasesSrtspLive(params: UseReleasesSrtspLiveParams) {
  const catalog = useCatalogService();
  const invalidateEvents = useMemo(() => getCreatorCatalogInvalidateEvents(), []);
  const queryKey = useMemo(() => `catalog-releases:${params.creatorId}`, [params.creatorId]);

  const fetchReleases = useCallback(async (): Promise<Album[]> => {
    return catalog.listAlbums();
  }, [catalog]);

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => shouldRefreshCreatorCatalog(event, { creatorId: params.creatorId }),
    [params.creatorId],
  );

  const liveQuery = useLiveQuery(queryKey, fetchReleases, invalidateEvents, {
    enabled: params.enabled !== false,
    initialData: params.initialData,
    skipInitialFetch: true,
    shouldInvalidate,
  });

  useEventSubscription(
    invalidateEvents,
    (event) => {
      if (!shouldRefreshCreatorCatalog(event, { creatorId: params.creatorId })) return;
      liveQuery.refresh();
    },
    params.enabled !== false,
  );

  return liveQuery;
}
