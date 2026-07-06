"use client";

import { useCallback } from "react";
import { shouldRefreshAdminWallet } from "@sonafrik/realtime/adapters";
import type { AdminRevenueDashboardData } from "@sonafrik/api/admin";
import { loadAdminRevenueDashboardAction } from "../actions/admin-live.actions";
import { useAdminSrtspLiveQuery } from "./useAdminSrtspLiveQuery";

export interface UseAdminRevenueSrtspLiveParams {
  initialData: AdminRevenueDashboardData;
  enabled?: boolean;
}

/** Revenus admin — consommateur SRTSP (Phase 3.9). */
export function useAdminRevenueSrtspLive(params: UseAdminRevenueSrtspLiveParams) {
  const fetchRevenue = useCallback(async (): Promise<AdminRevenueDashboardData> => {
    const result = await loadAdminRevenueDashboardAction();
    if (result.error || !result.data) throw new Error(result.error ?? "Erreur revenus");
    return result.data;
  }, []);

  return useAdminSrtspLiveQuery<AdminRevenueDashboardData>({
    queryKey: "admin-revenue-dashboard",
    fetcher: fetchRevenue,
    initialData: params.initialData,
    skipInitialFetch: true,
    enabled: params.enabled,
    shouldInvalidate: (event) => shouldRefreshAdminWallet(event),
  });
}
