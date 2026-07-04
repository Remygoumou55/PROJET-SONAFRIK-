"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, Input, buttonVariants } from "@sonafrik/ui";
import type { PublicationStatus, Track } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS } from "@sonafrik/types/catalog";
import { useCatalogService } from "../hooks/useCatalog";

type StatusFilter = "all" | PublicationStatus;
type SortMode = "updated" | "title";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "draft", label: "Brouillon" },
  { value: "pending_review", label: "En revue" },
  { value: "published", label: "Publié" },
  { value: "rejected", label: "Rejeté" },
];

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isEditable(status: PublicationStatus): boolean {
  return status === "draft" || status === "rejected";
}

function buildTracksUrl(page: number, search: string, status: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (search.trim()) params.set("q", search.trim());
  if (status !== "all") params.set("status", status);
  const query = params.toString();
  return query ? `/creator/catalog/tracks?${query}` : "/creator/catalog/tracks";
}

export function TrackList({
  tracks: initialTracks,
  total: initialTotal,
  page,
  pageSize,
  search: initialSearch,
  status: initialStatus,
}: {
  tracks: Track[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  status: string;
}) {
  const catalog = useCatalogService();
  const router = useRouter();
  const [tracks, setTracks] = useState(initialTracks);
  const [total, setTotal] = useState(initialTotal);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [sortMode, setSortMode] = useState<SortMode>("updated");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const statusFilter = (initialStatus || "all") as StatusFilter;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);

  const sorted = useMemo(() => {
    const list = [...tracks];
    list.sort((a, b) => {
      if (sortMode === "title") return a.title.localeCompare(b.title, "fr");
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return list;
  }, [tracks, sortMode]);

  function applyFilters(nextSearch: string, nextStatus: StatusFilter) {
    router.push(buildTracksUrl(1, nextSearch, nextStatus));
  }

  async function handleDelete(trackId: string, title: string) {
    if (!window.confirm(`Supprimer « ${title} » ? Cette action est irréversible.`)) return;
    setDeletingId(trackId);
    setError(null);
    try {
      await catalog.deleteTrack(trackId);
      setTracks((current) => current.filter((t) => t.id !== trackId));
      setTotal((current) => Math.max(0, current - 1));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer ce morceau.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-texte-principal text-lg font-semibold">Mes morceaux</h2>
          <p className="text-texte-secondaire mt-1 text-sm">
            {total} morceau{total !== 1 ? "x" : ""} dans votre catalogue
            {total > pageSize ? ` · page ${page}/${totalPages}` : ""}
          </p>
        </div>
        <Link href="/creator/catalog/tracks/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          + Publier un morceau
        </Link>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters(searchInput, statusFilter);
        }}
      >
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher un morceau…"
          aria-label="Rechercher un morceau"
          className="max-w-md"
        />
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="border-bordure bg-elevated text-texte-principal rounded-lg border px-3 py-2 text-sm"
          aria-label="Trier les morceaux"
        >
          <option value="updated">Plus récents</option>
          <option value="title">Titre A → Z</option>
        </select>
        <Button type="submit" size="sm" variant="outline">
          Rechercher
        </Button>
      </form>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={statusFilter === filter.value ? "primary" : "outline"}
            onClick={() => applyFilters(searchInput, filter.value)}
            aria-pressed={statusFilter === filter.value}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {error ? (
        <p className="text-sm" role="alert" style={{ color: "var(--color-erreur)" }}>
          {error}
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-texte-secondaire text-sm">
              {total === 0 && !initialSearch && statusFilter === "all"
                ? "Vous n'avez pas encore publié de morceau."
                : "Aucun morceau ne correspond à votre recherche."}
            </p>
            {total === 0 && !initialSearch && statusFilter === "all" ? (
              <Link href="/creator/catalog/tracks/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
                Publier mon premier morceau
              </Link>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  applyFilters("", "all");
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((track) => (
            <Card key={track.id}>
              <CardContent className="flex flex-wrap items-center gap-3 py-4">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm"
                  style={{ backgroundColor: "var(--color-elevated)" }}
                  aria-hidden="true"
                >
                  🎵
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-texte-principal truncate font-semibold">{track.title}</p>
                  <p className="text-texte-desactive text-xs">
                    {formatDuration(track.duration_seconds)} · Mis à jour le {formatDate(track.updated_at)}
                  </p>
                  {track.publication_status === "rejected" && track.rejection_reason ? (
                    <p className="mt-1 text-xs" style={{ color: "var(--color-erreur)" }}>
                      {track.rejection_reason}
                    </p>
                  ) : null}
                </div>
                <Badge variant="primary">{PUBLICATION_STATUS_LABELS[track.publication_status]}</Badge>
                {isEditable(track.publication_status) ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/creator/catalog/tracks/${track.id}/edit`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Modifier
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={deletingId === track.id}
                      onClick={() => void handleDelete(track.id, track.title)}
                    >
                      {deletingId === track.id ? "Suppression…" : "Supprimer"}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: "var(--color-bordure)" }}
          aria-label="Pagination du catalogue"
        >
          <p className="text-texte-desactive text-xs">
            {pageStart}–{pageEnd} sur {total}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={buildTracksUrl(page - 1, initialSearch, statusFilter)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                ← Précédent
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={buildTracksUrl(page + 1, initialSearch, statusFilter)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Suivant →
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
