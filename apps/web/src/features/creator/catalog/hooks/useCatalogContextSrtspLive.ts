"use client";

import { useCallback, useMemo } from "react";
import type { CatalogContext } from "@sonafrik/types";
import {
  getCreatorCatalogInvalidateEvents,
  shouldRefreshCreatorCatalog,
} from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useLiveQuery } from "@sonafrik/realtime/react";
import { useCatalogService } from "../hooks/useCatalog";

export interface UseCatalogContextSrtspLiveParams {
  creatorId: string;
  initialData: CatalogContext;
  enabled?: boolean;
}

/** Catalogue Hub — résumé KPIs (Phase 3.4). */
export function useCatalogContextSrtspLive(params: UseCatalogContextSrtspLiveParams) {
  const catalog = useCatalogService();
  const invalidateEvents = useMemo(() => getCreatorCatalogInvalidateEvents(), []);
  const queryKey = useMemo(() => `catalog-context:${params.creatorId}`, [params.creatorId]);

  const fetchContext = useCallback(async (): Promise<CatalogContext> => {
    return catalog.getCatalogContext();
  }, [catalog]);

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => shouldRefreshCreatorCatalog(event, { creatorId: params.creatorId }),
    [params.creatorId],
  );

  return useLiveQuery(queryKey, fetchContext, invalidateEvents, {
    enabled: params.enabled !== false,
    initialData: params.initialData,
    skipInitialFetch: true,
    shouldInvalidate,
  });
}
