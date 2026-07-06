"use client";

import { useCallback } from "react";
import { shouldRefreshAdminWallet } from "@sonafrik/realtime/adapters";
import type { AdminPayoutEntry } from "@sonafrik/types";
import { loadAdminWithdrawalsQueueAction } from "../actions/admin-live.actions";
import { useAdminSrtspLiveQuery } from "./useAdminSrtspLiveQuery";

export interface AdminWithdrawalsLiveData {
  queue: AdminPayoutEntry[];
}

export interface UseAdminWithdrawalsSrtspLiveParams {
  initialData: AdminWithdrawalsLiveData;
  status?: string;
  enabled?: boolean;
}

/** File retraits admin — consommateur SRTSP (Phase 3.9). */
export function useAdminWithdrawalsSrtspLive(params: UseAdminWithdrawalsSrtspLiveParams) {
  const fetchQueue = useCallback(async (): Promise<AdminWithdrawalsLiveData> => {
    const result = await loadAdminWithdrawalsQueueAction({
      status: params.status,
      limit: 200,
    });
    if (result.error) throw new Error(result.error);
    return { queue: result.queue ?? params.initialData.queue };
  }, [params.initialData.queue, params.status]);

  return useAdminSrtspLiveQuery<AdminWithdrawalsLiveData>({
    queryKey: `admin-withdrawals:${params.status ?? "pending"}`,
    fetcher: fetchQueue,
    initialData: params.initialData,
    skipInitialFetch: true,
    enabled: params.enabled,
    shouldInvalidate: (event) => shouldRefreshAdminWallet(event),
  });
}
