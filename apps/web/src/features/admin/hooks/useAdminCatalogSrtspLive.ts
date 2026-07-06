"use client";

import { useCallback } from "react";
import { shouldRefreshAdminCatalog } from "@sonafrik/realtime/adapters";
import type { PendingCatalogItem } from "@sonafrik/api/admin";
import { loadAdminPendingCatalogAction } from "../actions/admin-live.actions";
import { useAdminSrtspLiveQuery } from "./useAdminSrtspLiveQuery";

export interface AdminCatalogLiveData {
  items: PendingCatalogItem[];
}

export interface UseAdminCatalogSrtspLiveParams {
  initialData: AdminCatalogLiveData;
  enabled?: boolean;
}

/** File modération catalogue — consommateur SRTSP (Phase 3.9). */
export function useAdminCatalogSrtspLive(params: UseAdminCatalogSrtspLiveParams) {
  const fetchCatalog = useCallback(async (): Promise<AdminCatalogLiveData> => {
    const result = await loadAdminPendingCatalogAction();
    if (result.error) throw new Error(result.error);
    return { items: result.items ?? params.initialData.items };
  }, [params.initialData.items]);

  return useAdminSrtspLiveQuery<AdminCatalogLiveData>({
    queryKey: "admin-catalog-pending",
    fetcher: fetchCatalog,
    initialData: params.initialData,
    skipInitialFetch: true,
    enabled: params.enabled,
    shouldInvalidate: (event) => shouldRefreshAdminCatalog(event),
  });
}
