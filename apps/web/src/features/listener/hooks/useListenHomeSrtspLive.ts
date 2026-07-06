"use client";

import { useCallback, useEffect } from "react";
import { shouldRefreshListenerDiscovery } from "@sonafrik/realtime/adapters";
import type { HomepageData } from "../components/HomepageContentSections";
import { fetchHomepageDataClient } from "../lib/fetchHomepageDataClient";
import { HOME_INVALIDATE_EVENT } from "./useListenPageRefresh";
import { useListenerSrtspLiveQuery } from "./useListenerSrtspLiveQuery";

export interface UseListenHomeSrtspLiveParams {
  category: string;
  initialData: HomepageData;
  enabled?: boolean;
}

/** Accueil auditeur — consommateur SRTSP (Phase 3.8). */
export function useListenHomeSrtspLive(params: UseListenHomeSrtspLiveParams) {
  const fetchHome = useCallback(async (): Promise<HomepageData> => {
    return fetchHomepageDataClient(params.category);
  }, [params.category]);

  const liveQuery = useListenerSrtspLiveQuery<HomepageData>({
    queryKey: `listener-home:${params.category}`,
    fetcher: fetchHome,
    initialData: params.initialData,
    skipInitialFetch: true,
    enabled: params.enabled,
    shouldInvalidate: (event) => shouldRefreshListenerDiscovery(event),
  });

  useEffect(() => {
    const handler = () => {
      void liveQuery.refresh();
    };
    window.addEventListener(HOME_INVALIDATE_EVENT, handler);
    return () => window.removeEventListener(HOME_INVALIDATE_EVENT, handler);
  }, [liveQuery]);

  return liveQuery;
}
