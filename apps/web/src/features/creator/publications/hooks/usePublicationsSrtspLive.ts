"use client";

import { useCallback, useMemo, useRef } from "react";
import type { Album, Track } from "@sonafrik/types";
import type { PublicationTrackInsight } from "@sonafrik/api/publication-library";
import {
  normalizePublicationSort,
  parsePublicationLibraryQuery,
  shouldLoadPublicationInsight,
} from "@sonafrik/api/publication-library";
import {
  getPublicationLibraryInvalidateEvents,
  shouldRefreshPublicationLibrary,
} from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useLiveQuery } from "@sonafrik/realtime/react";
import { useCatalogService } from "../../catalog/hooks/useCatalog";

export interface PublicationsLibraryLiveData {
  tracks: Track[];
  total: number;
  catalogTotal: number;
  albumsById: Record<string, Album>;
  insights: PublicationTrackInsight[];
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

/** Cap anti-fuite mémoire session longue (B3/B7) — bornage des caches enrichissement. */
const PUBLICATION_CACHE_MAX_ENTRIES = 200;

function capCache<T>(cache: Record<string, T>, maxEntries: number): Record<string, T> {
  const keys = Object.keys(cache);
  if (keys.length <= maxEntries) return cache;
  return Object.fromEntries(
    keys.slice(keys.length - maxEntries).map((key) => [key, cache[key]!]),
  );
}

/** Mes publications — consommateur SRTSP officiel (Phase 3.2). */
export function usePublicationsSrtspLive(params: UsePublicationsSrtspLiveParams) {
  const catalog = useCatalogService();
  const invalidateEvents = useMemo(() => getPublicationLibraryInvalidateEvents(), []);
  const hasStableInitialData =
    params.initialData.tracks.length > 0 ||
    params.initialData.total > 0 ||
    params.initialData.catalogTotal > 0;
  const albumCacheRef = useRef<Record<string, Album>>(params.initialData.albumsById);
  const insightCacheRef = useRef<Record<string, PublicationTrackInsight>>(
    Object.fromEntries(params.initialData.insights.map((insight) => [insight.track_id, insight])),
  );
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
    const insightTrackIds = pageResult.tracks
      .filter((track) => shouldLoadPublicationInsight(track.publication_status))
      .map((track) => track.id);
    const missingAlbumIds = albumIds.filter((albumId) => !albumCacheRef.current[albumId]);
    const missingInsightTrackIds = insightTrackIds.filter(
      (trackId) => !insightCacheRef.current[trackId],
    );

    try {
      const albums = missingAlbumIds.length > 0 ? await catalog.listAlbumsByIds(missingAlbumIds) : [];
      if (albums.length > 0) {
        albumCacheRef.current = capCache(
          {
            ...albumCacheRef.current,
            ...Object.fromEntries(albums.map((album) => [album.id, album])),
          },
          PUBLICATION_CACHE_MAX_ENTRIES,
        );
      }
    } catch {
      // Tolérant: la liste reste fonctionnelle sans enrichissement album.
    }

    try {
      const insights =
        missingInsightTrackIds.length > 0
          ? await catalog.getPublicationInsights(missingInsightTrackIds)
          : [];
      if (insights.length > 0) {
        insightCacheRef.current = capCache(
          {
            ...insightCacheRef.current,
            ...Object.fromEntries(insights.map((insight) => [insight.track_id, insight])),
          },
          PUBLICATION_CACHE_MAX_ENTRIES,
        );
      }
    } catch {
      // Tolérant: on affiche les publications même sans métriques enrichies.
    }

    return {
      tracks: pageResult.tracks,
      total: pageResult.total,
      catalogTotal,
      albumsById: Object.fromEntries(
        albumIds
          .map((albumId) => albumCacheRef.current[albumId])
          .filter((album): album is Album => Boolean(album))
          .map((album) => [album.id, album]),
      ),
      insights: insightTrackIds
        .map((trackId) => insightCacheRef.current[trackId])
        .filter((insight): insight is PublicationTrackInsight => Boolean(insight)),
    };
  }, [catalog, params.page, params.pageSize, params.search, params.sort, params.status]);

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => shouldRefreshPublicationLibrary(event, params.creatorId),
    [params.creatorId],
  );

  return useLiveQuery(queryKey, fetchLibrary, invalidateEvents, {
    enabled: params.enabled !== false,
    initialData: params.initialData,
    skipInitialFetch: hasStableInitialData,
    shouldInvalidate,
  });
}
