"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Album, Track } from "@sonafrik/types";
import { Button, buttonVariants } from "@sonafrik/ui";
import { publishCreatorLdseEvent } from "@/features/shared/ldse/creator/publishCreatorLdseEvent";
import { CREATOR_LDSE_EVENTS } from "@/features/shared/ldse/creator/creator-ldse-config";
import { InstantSearchBar } from "@/features/shared/search/InstantSearchBar";
import { EmptyState } from "@/features/shared/ui/EmptyState";
import { useCatalogService } from "../../catalog/hooks/useCatalog";
import { usePublicationsSrtspLive } from "../hooks/usePublicationsSrtspLive";
import { PUBLICATIONS_STATUS_FILTERS, type PublicationsStatusFilter } from "../lib/publicationConstants";
import {
  buildPublicationsLibraryUrl,
  parsePublicationsSortUi,
  type PublicationsSortUi,
} from "../lib/publicationLibraryUrl";
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
}) {
  const catalog = useCatalogService();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const statusFilter = (initialStatus || "all") as PublicationsStatusFilter;
  const sortUi = parsePublicationsSortUi(initialSort);

  const { data: liveData, refresh: refreshLibrary } = usePublicationsSrtspLive({
    creatorId,
    page,
    pageSize,
    search: initialSearch,
    status: statusFilter,
    sort: sortUi,
    initialData: {
      tracks: initialTracks,
      total: filteredTotal,
      catalogTotal,
      albumsById,
    },
  });

  const tracks = liveData?.tracks ?? initialTracks;
  const total = liveData?.total ?? filteredTotal;
  const catalogTotalLive = liveData?.catalogTotal ?? catalogTotal;
  const albumsByIdLive = liveData?.albumsById ?? albumsById;
  const isLibraryEmpty = catalogTotalLive === 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);

  const navigate = useCallback(
    (params: { page?: number; q?: string; status?: PublicationsStatusFilter; sort?: PublicationsSortUi }) => {
      router.push(
        buildPublicationsLibraryUrl({
          page: params.page ?? 1,
          q: params.q ?? initialSearch,
          status: params.status ?? statusFilter,
          sort: params.sort ?? sortUi,
        }),
      );
    },
    [router, initialSearch, statusFilter, sortUi],
  );

  const handleSearchDebounced = useCallback(
    (value: string) => {
      if (value.trim() === initialSearch.trim()) return;
      navigate({ q: value, page: 1 });
    },
    [navigate, initialSearch],
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

  const publishCta = (
    <Link href="/creator/catalog/tracks/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
      ➕ Publier un morceau
    </Link>
  );

  return (
    <div className="pub-library">
      <div className="pub-library__toolbar">{publishCta}</div>

      {error ? (
        <p className="pub-library__error" role="alert">
          {error}
        </p>
      ) : null}

      {isLibraryEmpty ? (
        <EmptyState
          icon="🎵"
          title="Aucune publication disponible."
          description="Publiez votre premier morceau pour commencer votre catalogue SONAFRIK."
          action={publishCta}
        />
      ) : (
        <>
          <div className="pub-library__controls">
            <InstantSearchBar
              value={initialSearch}
              onDebouncedChange={handleSearchDebounced}
              placeholder="Rechercher une publication…"
              ariaLabel="Rechercher une publication"
              className="pub-library__search"
            />
            <select
              value={sortUi}
              onChange={(e) => handleSortChange(e.target.value as PublicationsSortUi)}
              className="pub-library__sort"
              aria-label="Trier les publications"
            >
              <option value="updated">Plus récents</option>
              <option value="title">Titre A → Z</option>
            </select>
          </div>

          <div className="pub-library__filters" role="tablist" aria-label="Filtrer par statut">
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

          {tracks.length === 0 ? (
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
            <div className="pub-library__list">
              {tracks.map((track) => (
                <PublicationCard
                  key={track.id}
                  track={track}
                  album={track.album_id ? albumsByIdLive[track.album_id] : undefined}
                  onSelect={handleSelectTrack}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <nav className="pub-library__pagination" aria-label="Pagination des publications">
              <p className="pub-library__pagination-meta">
                {pageStart}–{pageEnd} sur {total}
              </p>
              <div className="pub-library__pagination-actions">
                {page > 1 ? (
                  <Link
                    href={buildPublicationsLibraryUrl({
                      page: page - 1,
                      q: initialSearch,
                      status: statusFilter,
                      sort: sortUi,
                    })}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    ← Précédent
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link
                    href={buildPublicationsLibraryUrl({
                      page: page + 1,
                      q: initialSearch,
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

      <PublicationDetailPanel
        track={selectedTrack}
        album={selectedTrack?.album_id ? albumsByIdLive[selectedTrack.album_id] : undefined}
        open={selectedTrack !== null}
        onClose={handleCloseDetail}
        onDelete={(track) => void handleDelete(track)}
        deleting={deletingId === selectedTrack?.id}
      />
    </div>
  );
}
