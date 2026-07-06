"use client";

import { useCallback } from "react";
import { shouldRefreshAdminSnapshot } from "@sonafrik/realtime/adapters";
import type { AdminAwardsDashboard } from "@sonafrik/api/admin";
import { loadAdminAwardsDashboardAction } from "../actions/admin-live.actions";
import { useAdminSrtspLiveQuery } from "./useAdminSrtspLiveQuery";

export interface UseAdminAwardsSrtspLiveParams {
  initialData: AdminAwardsDashboard;
  enabled?: boolean;
}

/** Awards admin — consommateur SRTSP snapshot (Phase 3.9). */
export function useAdminAwardsSrtspLive(params: UseAdminAwardsSrtspLiveParams) {
  const fetchAwards = useCallback(async (): Promise<AdminAwardsDashboard> => {
    const result = await loadAdminAwardsDashboardAction();
    if (result.error || !result.data) throw new Error(result.error ?? "Erreur awards");
    return result.data;
  }, []);

  return useAdminSrtspLiveQuery<AdminAwardsDashboard>({
    queryKey: "admin-awards-dashboard",
    fetcher: fetchAwards,
    initialData: params.initialData,
    skipInitialFetch: true,
    enabled: params.enabled,
    shouldInvalidate: (event) => shouldRefreshAdminSnapshot(event),
  });
}
