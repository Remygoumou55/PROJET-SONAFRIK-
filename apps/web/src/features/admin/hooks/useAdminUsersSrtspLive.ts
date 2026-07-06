"use client";

import { useCallback } from "react";
import { shouldRefreshAdminUsers } from "@sonafrik/realtime/adapters";
import type { AdminUsersFilter, AdminUsersListResult } from "@sonafrik/types";
import { loadAdminUsersListAction } from "../actions/admin-live.actions";
import { useAdminSrtspLiveQuery } from "./useAdminSrtspLiveQuery";

export interface UseAdminUsersSrtspLiveParams {
  initialData: AdminUsersListResult;
  filter?: AdminUsersFilter;
  query?: string;
  page: number;
  enabled?: boolean;
}

/** Utilisateurs admin — consommateur SRTSP (Phase 3.9). */
export function useAdminUsersSrtspLive(params: UseAdminUsersSrtspLiveParams) {
  const fetchUsers = useCallback(async (): Promise<AdminUsersListResult> => {
    const result = await loadAdminUsersListAction({
      q: params.query,
      filter: params.filter,
      page: params.page,
    });
    if (result.error) throw new Error(result.error);
    return {
      users: result.users ?? params.initialData.users,
      total: result.total ?? params.initialData.total,
      page: result.page ?? params.page,
      limit: result.limit ?? params.initialData.limit,
    };
  }, [params.filter, params.initialData.limit, params.initialData.total, params.initialData.users, params.page, params.query]);

  return useAdminSrtspLiveQuery<AdminUsersListResult>({
    queryKey: `admin-users:${params.filter ?? "all"}:${params.query ?? ""}:${params.page}`,
    fetcher: fetchUsers,
    initialData: params.initialData,
    skipInitialFetch: true,
    enabled: params.enabled,
    shouldInvalidate: (event) => shouldRefreshAdminUsers(event),
  });
}
