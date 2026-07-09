"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Album, Track } from "@sonafrik/types";
import {
  insightsRecordFromList,
  normalizePublicationSort,
  publicationStatusMatchesSearch,
  sortTracksWithInsights,
  type PublicationTrackInsight,
} from "@sonafrik/api/publication-library";
import { Button, buttonVariants } from "@sonafrik/ui";
import { publishCreatorLdseEvent } from "@/features/shared/ldse/creator/publishCreatorLdseEvent";
import { CREATOR_LDSE_EVENTS } from "@/features/shared/ldse/creator/creator-ldse-config";
import { InstantSearchBar } from "@/features/shared/search/InstantSearchBar";
import { EmptyState } from "@/features/shared/ui/EmptyState";
import { useCatalogService } from "../../catalog/hooks/useCatalog";
import { usePublicationsSrtspLive } from "../hooks/usePublicationsSrtspLive";
import {
  PUBLICATIONS_SORT_OPTIONS,
  PUBLICATIONS_STATUS_FILTERS,
  type PublicationsSortUi,
  type PublicationsStatusFilter,
} from "../lib/publicationConstants";
import {
  buildPublicationsLibraryUrl,
  parsePublicationsSortUi,
} from "../lib/publicationLibraryUrl";
import { CatalogEmptyState } from "./CatalogEmptyState";
import { PublicationCard } from "./PublicationCard";

const PublicationDetailPanel = dynamic(
  () =>
    import("./PublicationDetailPanel").then((mod) => ({ default: mod.PublicationDetailPanel })),
  { ssr: false },
);

export function PublicationsLibrary({
  tracks: initialTracks,
  total: filteredTotal,
  catalogTotal,
  creatorId,
  page,
  pageSize,
  search: initialSearch,
  status: initialStatus,
  sort: initialSort,
  albumsById,
  insights: initialInsights,
  loadError = null,
}: {
  tracks: Track[];
  total: number;
  catalogTotal: number;
  creatorId: string;
  page: number;
  pageSize: number;
  search: string;
  status: string;
  sort: string;
  albumsById: Record<string, Album>;
  insights: PublicationTrackInsight[];
  loadError?: string | null;
}) {
  const catalog = useCatalogService();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(loadError);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [liveReady, setLiveReady] = useState(false);
  const emptyRecoveryTriggeredRef = useRef(false);

  const currentPage = useMemo(() => {
    const rawPage = searchParams.get("page");
    const parsedPage = Number.parseInt(rawPage ?? "", 10);
    return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : page;
  }, [searchParams, page]);
  const currentSearch = useMemo(
    () => searchParams.get("q")?.trim() ?? initialSearch,
    [searchParams, initialSearch],
  );
  const statusFilter = useMemo(
    () => (searchParams.get("status") ?? initialStatus ?? "all") as PublicationsStatusFilter,
    [searchParams, initialStatus],
  );
  const sortUi = useMemo(
    () => parsePublicationsSortUi(searchParams.get("sort") ?? initialSort),
    [searchParams, initialSort],
  );
  const librarySort = useMemo(() => normalizePublicationSort(sortUi), [sortUi]);

  const { data: liveData, loading: libraryLoading, refresh: refreshLibrary } = usePublicationsSrtspLive({
    creatorId,
    page: currentPage,
    pageSize,
    search: currentSearch,
    status: statusFilter,
    sort: sortUi,
    initialData: {
      tracks: initialTracks,
      total: filteredTotal,
      catalogTotal,
      albumsById,
      insights: initialInsights,
    },
    enabled: liveReady,
  });

  useEffect(() => {
    const schedule =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => setLiveReady(true), { timeout: 1200 })
        : window.setTimeout(() => setLiveReady(true), 800);

    return () => {
      if (typeof schedule === "number") {
        window.clearTimeout(schedule);
        return;
      }
      window.cancelIdleCallback(schedule);
    };
  }, []);

  useEffect(() => {
    setError(loadError);
  }, [loadError]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && !manualRefreshing && !libraryLoading) {
        refreshLibrary();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshLibrary, manualRefreshing, libraryLoading]);

  useEffect(() => {
    if (!libraryLoading) {
      setManualRefreshing(false);
    }
  }, [libraryLoading]);

  const tracks = liveData?.tracks ?? initialTracks;
  const total = liveData?.total ?? filteredTotal;
  const catalogTotalLive = liveData?.catalogTotal ?? catalogTotal;

  useEffect(() => {
    const shouldAttemptRecovery =
      creatorId.length > 0 &&
      tracks.length === 0 &&
      catalogTotalLive === 0 &&
      currentPage === 1 &&
      currentSearch.length === 0 &&
      statusFilter === "all" &&
      !libraryLoading &&
      !manualRefreshing &&
      !error &&
      !emptyRecoveryTriggeredRef.current;

    if (!shouldAttemptRecovery) {
      if (catalogTotalLive > 0 || tracks.length > 0) {
        emptyRecoveryTriggeredRef.current = false;
      }
      return;
    }

    emptyRecoveryTriggeredRef.current = true;
    const retryTimer = window.setTimeout(() => {
      refreshLibrary();
    }, 300);

    return () => window.clearTimeout(retryTimer);
  }, [
    creatorId,
    tracks.length,
    catalogTotalLive,
    currentPage,
    currentSearch,
    statusFilter,
    libraryLoading,
    manualRefreshing,
    error,
    refreshLibrary,
  ]);

  const albumsByIdLive = liveData?.albumsById ?? albumsById;
  const insightsById = useMemo(
    () => insightsRecordFromList(liveData?.insights ?? initialInsights),
    [liveData?.insights, initialInsights],
  );

  const visibleTracks = useMemo(() => {
    const sorted = sortTracksWithInsights(tracks, librarySort, insightsById);
    const term = currentSearch.trim();
    if (!term) return sorted;
    return sorted.filter(
      (track: Track) =>
        track.title.toLowerCase().includes(term.toLowerCase()) ||
        publicationStatusMatchesSearch(track.publication_status, term),
    );
  }, [tracks, librarySort, insightsById, currentSearch]);

  const isLibraryEmpty = catalogTotalLive === 0;
  const showLoadingState = libraryLoading && catalogTotalLive === 0 && !error;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);

  const navigate = useCallback(
    (params: {
      page?: number;
      q?: string;
      status?: PublicationsStatusFilter;
      sort?: PublicationsSortUi;
    }) => {
      router.push(
        buildPublicationsLibraryUrl({
          page: params.page ?? 1,
          q: params.q ?? currentSearch,
          status: params.status ?? statusFilter,
          sort: params.sort ?? sortUi,
        }),
      );
    },
    [router, currentSearch, statusFilter, sortUi],
  );

  const handleSearchDebounced = useCallback(
    (value: string) => {
      if (value.trim() === currentSearch.trim()) return;
      navigate({ q: value, page: 1 });
    },
    [navigate, currentSearch],
  );

  const handleSortChange = useCallback(
    (next: PublicationsSortUi) => {
      if (next === sortUi) return;
      navigate({ sort: next, page: 1 });
    },
    [navigate, sortUi],
  );

  const handleSelectTrack = useCallback((track: Track) => {
    setSelectedTrack(track);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedTrack(null);
  }, []);

  const handleManualRefresh = useCallback(() => {
    if (manualRefreshing || libraryLoading) return;
    setManualRefreshing(true);
    refreshLibrary();
  }, [refreshLibrary, manualRefreshing, libraryLoading]);

  async function handleDelete(track: Track) {
    if (!window.confirm(`Supprimer « ${track.title} » ? Cette action est irréversible.`)) return;
    setDeletingId(track.id);
    setError(null);
    try {
      await catalog.deleteTrack(track.id);
      setSelectedTrack(null);
      publishCreatorLdseEvent(CREATOR_LDSE_EVENTS.trackUpdated, creatorId, { trackId: track.id });
      refreshLibrary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer cette publication.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="pub-library pub-catalog">
      {error ? (
        <p className="pub-library__error" role="alert">
          {error}
        </p>
      ) : null}

      {showLoadingState ? (
        <div className="pub-library__loading" aria-live="polite" aria-busy="true">
          <p>Chargement de vos publications…</p>
        </div>
      ) : isLibraryEmpty ? (
        <CatalogEmptyState />
      ) : (
        <>
          <div className="pub-catalog__controls">
            <InstantSearchBar
              value={currentSearch}
              onDebouncedChange={handleSearchDebounced}
              placeholder="Rechercher un morceau, un album ou un statut…"
              ariaLabel="Rechercher dans le catalogue"
              className="pub-library__search"
            />
            <select
              value={sortUi}
              onChange={(e) => handleSortChange(e.target.value as PublicationsSortUi)}
              className="pub-library__sort"
              aria-label="Trier le catalogue"
            >
              {PUBLICATIONS_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={manualRefreshing}
              onClick={handleManualRefresh}
              aria-busy={manualRefreshing}
            >
              {manualRefreshing ? "Actualisation…" : "Actualiser"}
            </Button>
          </div>

          <div className="pub-catalog__filters" aria-label="Filtrer le catalogue">
            {PUBLICATIONS_STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={statusFilter === filter.value ? "primary" : "outline"}
                onClick={() => navigate({ status: filter.value, page: 1 })}
                aria-pressed={statusFilter === filter.value}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="pub-catalog__table-head" aria-hidden="true">
            <span>Œuvre</span>
            <span>Dates</span>
            <span>Statut</span>
            <span>Streams</span>
            <span>Revenus</span>
            <span>Activité</span>
            <span />
          </div>

          {visibleTracks.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Aucune publication ne correspond à votre recherche."
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate({ q: "", status: "all", page: 1 })}
                >
                  Réinitialiser les filtres
                </Button>
              }
            />
          ) : (
            <div className="pub-catalog__list">
              {visibleTracks.map((track: Track) => (
                <PublicationCard
                  key={track.id}
                  track={track}
                  album={track.album_id ? albumsByIdLive[track.album_id] : undefined}
                  insight={insightsById[track.id]}
                  deleting={deletingId === track.id}
                  onSelect={handleSelectTrack}
                  onDelete={(item) => void handleDelete(item)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <nav className="pub-library__pagination" aria-label="Pagination du catalogue">
              <p className="pub-library__pagination-meta">
                {pageStart}–{pageEnd} sur {total}
              </p>
              <div className="pub-library__pagination-actions">
                {currentPage > 1 ? (
                  <Link
                    href={buildPublicationsLibraryUrl({
                      page: currentPage - 1,
                      q: currentSearch,
                      status: statusFilter,
                      sort: sortUi,
                    })}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    ← Précédent
                  </Link>
                ) : null}
                {currentPage < totalPages ? (
                  <Link
                    href={buildPublicationsLibraryUrl({
                      page: currentPage + 1,
                      q: currentSearch,
                      status: statusFilter,
                      sort: sortUi,
                    })}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Suivant →
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}
        </>
      )}

      {selectedTrack ? (
        <PublicationDetailPanel
          track={selectedTrack}
          album={selectedTrack.album_id ? albumsByIdLive[selectedTrack.album_id] : undefined}
          open
          onClose={handleCloseDetail}
          onDelete={(track) => void handleDelete(track)}
          deleting={deletingId === selectedTrack.id}
        />
      ) : null}
    </div>
  );
}
