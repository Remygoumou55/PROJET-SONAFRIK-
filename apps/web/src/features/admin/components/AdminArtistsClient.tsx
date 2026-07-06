"use client";

import { useState } from "react";
import type { AdminArtistListItem, AdminArtistsFilter, AdminCreatorTier } from "@sonafrik/types";
import {
  adminChangeArtistTierAction,
  adminSuspendCreatorAction,
  adminVerifyArtistAction,
  adminWarnCreatorAction,
} from "@/features/admin/actions/admin-moderation.actions";
import { ADMIN_LDSE_EVENTS } from "@/features/shared/ldse/admin/admin-ldse-config";
import { publishAdminLdseEvent } from "@/features/shared/ldse/admin/AdminLdseProvider";
import { useAdminArtistsSrtspLive } from "../hooks/useAdminArtistsSrtspLive";
import { AdminTable } from "./AdminTable";
import { AdminSearchBar } from "./AdminSearchBar";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { buildAdminArtistsColumns, type SelectedArtist } from "./adminArtistsColumns";

interface AdminArtistsClientProps {
  artists: AdminArtistListItem[];
  total: number;
  page: number;
  limit: number;
  currentFilter?: AdminArtistsFilter;
  currentQuery?: string;
}

function buildPageHref(page: number, filter?: string, query?: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", page.toString());
  if (filter && filter !== "all") params.set("filter", filter);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/admin/artists?${qs}` : "/admin/artists";
}

export function AdminArtistsClient({
  artists,
  total,
  page,
  limit,
  currentFilter,
  currentQuery,
}: AdminArtistsClientProps) {
  const [selectedArtist, setSelectedArtist] = useState<SelectedArtist | null>(null);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const live = useAdminArtistsSrtspLive({
    initialData: { artists, total, page, limit },
    filter: currentFilter,
    query: currentQuery,
    page,
  });
  const liveArtists = live.data?.artists ?? artists;
  const liveTotal = live.data?.total ?? total;
  const livePage = live.data?.page ?? page;
  const liveLimit = live.data?.limit ?? limit;

  const handleVerify = async (creatorId: string, approved: boolean) => {
    setActionError(null);
    const result = await adminVerifyArtistAction({
      creatorId,
      approved,
      note: approved ? "Vérification approuvée" : "Vérification refusée",
    });
    if (result.error) { setActionError(result.error); return; }
    publishAdminLdseEvent(ADMIN_LDSE_EVENTS.userUpdated, { creatorId });
  };

  const handleChangeTier = async (creatorId: string, newTier: AdminCreatorTier) => {
    setActionError(null);
    const result = await adminChangeArtistTierAction({ creatorId, newTier });
    if (result.error) { setActionError(result.error); return; }
    publishAdminLdseEvent(ADMIN_LDSE_EVENTS.userUpdated, { creatorId, newTier });
  };

  const executeModeration = async () => {
    if (!selectedArtist?.action || selectedArtist.action === "view") return;
    setActionError(null);
    const result =
      selectedArtist.action === "warn"
        ? await adminWarnCreatorAction({ ownerId: selectedArtist.ownerId, artistName: selectedArtist.name })
        : await adminSuspendCreatorAction({ creatorId: selectedArtist.creatorId });
    if (result.error) { setActionError(result.error); return; }
    setSelectedArtist(null);
    publishAdminLdseEvent(ADMIN_LDSE_EVENTS.userUpdated, { creatorId: selectedArtist.creatorId });
  };

  const columns = buildAdminArtistsColumns({
    expandedArtist,
    setExpandedArtist,
    setSelectedArtist,
    handleVerify,
    handleChangeTier,
  });

  const filters: { key: AdminArtistsFilter; label: string }[] = [
    { key: "all", label: `Tous (${liveTotal.toLocaleString("fr-FR")})` },
    { key: "pending", label: "À vérifier" },
    { key: "verified", label: "Vérifiés" },
    { key: "tier_etabli", label: "Établis" },
    { key: "suspended", label: "Suspendus" },
  ];

  const totalPages = Math.ceil(liveTotal / liveLimit);
  const filterKey = currentFilter ?? "all";
  const confirmFirstName = (selectedArtist?.name ?? "CONFIRMER").split(" ")[0]?.toUpperCase() ?? "CONFIRMER";

  return (
    <>
      <div className="admin-toolbar">
        <AdminSearchBar placeholder="Rechercher par nom de scène..." />
        <div className="admin-filters">
          {filters.map((f) => (
            <a
              key={f.key}
              href={buildPageHref(1, f.key === "all" ? undefined : f.key, currentQuery)}
              className={`admin-filter-btn ${
                (f.key === "all" && !currentFilter) || currentFilter === f.key ? "active" : ""
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ marginLeft: "auto" }} disabled>
          📥 Export CSV
        </button>
      </div>

      {actionError ? (
        <p className="admin-cell-muted" style={{ color: "var(--color-erreur)", marginBottom: 12 }}>
          {actionError}
        </p>
      ) : null}

      <AdminTable
        columns={columns}
        data={liveArtists}
        keyField="creator_id"
        emptyMessage="Aucun artiste trouvé."
        expandedRowKey={expandedArtist}
        renderExpandedRow={(artist) => (
          <div className="admin-user-detail">
            <div className="admin-user-detail-grid">
              <div>
                <p className="admin-user-detail-label">Propriétaire</p>
                <p className="admin-user-detail-value">{artist.owner_name ?? "—"}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">Téléphone</p>
                <p className="admin-user-detail-value">{artist.owner_phone ?? "—"}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">Email</p>
                <p className="admin-user-detail-value">{artist.owner_email ?? "—"}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">Statut créateur</p>
                <p className="admin-user-detail-value">{artist.creator_status}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">Genres</p>
                <p className="admin-user-detail-value">{artist.genres.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">Inscription</p>
                <p className="admin-user-detail-value">
                  {new Date(artist.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>
        )}
      />

      {totalPages > 1 ? (
        <div className="admin-pagination">
          {livePage > 1 ? (
            <a
              href={buildPageHref(livePage - 1, filterKey !== "all" ? filterKey : undefined, currentQuery)}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              ← Précédent
            </a>
          ) : null}
          <span className="admin-pagination-info">
            Page {livePage} / {totalPages} — {liveTotal.toLocaleString("fr-FR")} résultats
          </span>
          {livePage < totalPages ? (
            <a
              href={buildPageHref(livePage + 1, filterKey !== "all" ? filterKey : undefined, currentQuery)}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              Suivant →
            </a>
          ) : null}
        </div>
      ) : null}

      {selectedArtist && selectedArtist.action !== "view" ? (
        <AdminConfirmModal
          isOpen
          title={
            selectedArtist.action === "warn"
              ? `Avertir ${selectedArtist.name}`
              : `Suspendre ${selectedArtist.name}`
          }
          description={
            selectedArtist.action === "warn"
              ? `Un avertissement officiel sera envoyé au titulaire de ${selectedArtist.name}. Enregistré dans le journal d'audit.`
              : `Le compte artiste de ${selectedArtist.name} sera suspendu. Ses morceaux seront retirés de l'écoute publique.`
          }
          confirmText={confirmFirstName}
          confirmLabel={
            selectedArtist.action === "warn" ? "Envoyer l'avertissement" : "Suspendre l'artiste"
          }
          isDanger={selectedArtist.action === "suspend"}
          onConfirm={executeModeration}
          onCancel={() => setSelectedArtist(null)}
        />
      ) : null}
    </>
  );
}
