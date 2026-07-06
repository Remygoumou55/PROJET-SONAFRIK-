"use client";

import { useCallback } from "react";
import { shouldRefreshAdminUsers } from "@sonafrik/realtime/adapters";
import type { AdminArtistsFilter, AdminArtistsListResult } from "@sonafrik/types";
import { loadAdminArtistsListAction } from "../actions/admin-live.actions";
import { useAdminSrtspLiveQuery } from "./useAdminSrtspLiveQuery";

export interface UseAdminArtistsSrtspLiveParams {
  initialData: AdminArtistsListResult;
  filter?: AdminArtistsFilter;
  query?: string;
  page: number;
  enabled?: boolean;
}

/** Artistes admin — consommateur SRTSP (Phase 3.9). */
export function useAdminArtistsSrtspLive(params: UseAdminArtistsSrtspLiveParams) {
  const fetchArtists = useCallback(async (): Promise<AdminArtistsListResult> => {
    const result = await loadAdminArtistsListAction({
      q: params.query,
      filter: params.filter,
      page: params.page,
    });
    if (result.error) throw new Error(result.error);
    return {
      artists: result.artists ?? params.initialData.artists,
      total: result.total ?? params.initialData.total,
      page: result.page ?? params.page,
      limit: result.limit ?? params.initialData.limit,
    };
  }, [params.filter, params.initialData.artists, params.initialData.limit, params.initialData.total, params.page, params.query]);

  return useAdminSrtspLiveQuery<AdminArtistsListResult>({
    queryKey: `admin-artists:${params.filter ?? "all"}:${params.query ?? ""}:${params.page}`,
    fetcher: fetchArtists,
    initialData: params.initialData,
    skipInitialFetch: true,
    enabled: params.enabled,
    shouldInvalidate: (event) => shouldRefreshAdminUsers(event),
  });
}
