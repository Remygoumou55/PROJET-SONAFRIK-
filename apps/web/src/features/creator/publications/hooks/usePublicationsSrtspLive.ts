"use client";

import { useCallback, useMemo } from "react";
import type { Album, Track } from "@sonafrik/types";
import {
  normalizePublicationSort,
  parsePublicationLibraryQuery,
} from "@sonafrik/api/catalog";
import {
  getPublicationLibraryInvalidateEvents,
  shouldRefreshPublicationLibrary,
} from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useEventSubscription, useLiveQuery } from "@sonafrik/realtime/react";
import { useCatalogService } from "../../catalog/hooks/useCatalog";

export interface PublicationsLibraryLiveData {
  tracks: Track[];
  total: number;
  catalogTotal: number;
  albumsById: Record<string, Album>;
}

export interface UsePublicationsSrtspLiveParams {
  creatorId: string;
  page: number;
  pageSize: number;
  search: string;
  status: string;
  sort: string;
  initialData: PublicationsLibraryLiveData;
  enabled?: boolean;
}

/** Mes publications — consommateur SRTSP officiel (Phase 3.2). */
export function usePublicationsSrtspLive(params: UsePublicationsSrtspLiveParams) {
  const catalog = useCatalogService();
  const invalidateEvents = useMemo(() => getPublicationLibraryInvalidateEvents(), []);
  const queryKey = useMemo(
    () =>
      `pub-lib:${params.creatorId}:${params.page}:${params.search}:${params.status}:${params.sort}:${params.pageSize}`,
    [params.creatorId, params.page, params.search, params.status, params.sort, params.pageSize],
  );

  const fetchLibrary = useCallback(async (): Promise<PublicationsLibraryLiveData> => {
    const libraryQuery = parsePublicationLibraryQuery({
      q: params.search,
      status: params.status,
      sort: params.sort,
      page: params.page,
      pageSize: params.pageSize,
    });
    const [pageResult, catalogTotal] = await Promise.all([
      catalog.listTracksPage({
        limit: libraryQuery.limit,
        offset: libraryQuery.offset,
        search: libraryQuery.search,
        status: libraryQuery.status !== "all" ? libraryQuery.status : undefined,
        sort: libraryQuery.sort ?? normalizePublicationSort(params.sort),
        searchFields: libraryQuery.searchFields,
      }),
      catalog.countCreatorTracks(),
    ]);
    const albumIds = [
      ...new Set(pageResult.tracks.map((t) => t.album_id).filter((id): id is string => Boolean(id))),
    ];
    const albums = albumIds.length > 0 ? await catalog.listAlbumsByIds(albumIds) : [];
    return {
      tracks: pageResult.tracks,
      total: pageResult.total,
      catalogTotal,
      albumsById: Object.fromEntries(albums.map((album) => [album.id, album])),
    };
  }, [catalog, params.page, params.pageSize, params.search, params.sort, params.status]);

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => shouldRefreshPublicationLibrary(event, params.creatorId),
    [params.creatorId],
  );

  const liveQuery = useLiveQuery(queryKey, fetchLibrary, invalidateEvents, {
    enabled: params.enabled !== false,
    initialData: params.initialData,
    skipInitialFetch: true,
    shouldInvalidate,
  });

  useEventSubscription(
    invalidateEvents,
    (event) => {
      if (!shouldRefreshPublicationLibrary(event, params.creatorId)) return;
      liveQuery.refresh();
    },
    params.enabled !== false,
  );

  return liveQuery;
}
