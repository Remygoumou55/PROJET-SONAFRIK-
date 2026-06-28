"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminArtistListItem, AdminArtistsFilter, AdminCreatorTier } from "@sonafrik/types";
import {
  adminChangeArtistTierAction,
  adminSuspendCreatorAction,
  adminVerifyArtistAction,
  adminWarnCreatorAction,
} from "@/features/admin/actions/admin-moderation.actions";
import { AdminTable } from "./AdminTable";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminSearchBar } from "./AdminSearchBar";
import { AdminConfirmModal } from "./AdminConfirmModal";

type ArtistAction = "warn" | "suspend" | "view" | null;

interface SelectedArtist {
  creatorId: string;
  ownerId: string;
  name: string;
  action: ArtistAction;
}

interface AdminArtistsClientProps {
  artists: AdminArtistListItem[];
  total: number;
  page: number;
  limit: number;
  currentFilter?: AdminArtistsFilter;
  currentQuery?: string;
}

const TIER_LABELS: Record<AdminCreatorTier, string> = {
  emergent: "Émergent",
  croissance: "Croissance",
  etabli: "Établi",
};

function tierClassName(tier: AdminCreatorTier): string {
  if (tier === "etabli") return "admin-tier-pill admin-tier-etabli";
  if (tier === "croissance") return "admin-tier-pill admin-tier-croissance";
  return "admin-tier-pill admin-tier-emergent";
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
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleVerify = async (creatorId: string, approved: boolean) => {
    setActionError(null);
    const result = await adminVerifyArtistAction({
      creatorId,
      approved,
      note: approved ? "Vérification approuvée" : "Vérification refusée",
    });
    if (result.error) {
      setActionError(result.error);
      return;
    }
    startTransition(() => router.refresh());
  };

  const handleChangeTier = async (creatorId: string, newTier: AdminCreatorTier) => {
    setActionError(null);
    const result = await adminChangeArtistTierAction({ creatorId, newTier });
    if (result.error) {
      setActionError(result.error);
      return;
    }
    startTransition(() => router.refresh());
  };

  const executeModeration = async () => {
    if (!selectedArtist?.action || selectedArtist.action === "view") return;
    setActionError(null);

    const result =
      selectedArtist.action === "warn"
        ? await adminWarnCreatorAction({
            ownerId: selectedArtist.ownerId,
            artistName: selectedArtist.name,
          })
        : await adminSuspendCreatorAction({ creatorId: selectedArtist.creatorId });

    if (result.error) {
      setActionError(result.error);
      return;
    }

    setSelectedArtist(null);
    startTransition(() => router.refresh());
  };

  const columns = [
    {
      key: "stage_name",
      label: "Artiste",
      render: (row: AdminArtistListItem) => {
        const avatar = row.profile_photo ?? row.avatar_url;
        return (
          <div className="admin-artist-row">
            <div className="admin-artist-avatar">
              {avatar ? (
                <Image src={avatar} alt={row.stage_name} width={36} height={36} unoptimized />
              ) : (
                <span aria-hidden>🎤</span>
              )}
            </div>
            <div>
              <p className="admin-cell-primary">{row.stage_name}</p>
              <p className="admin-cell-secondary">{row.owner_name ?? "—"}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "genres",
      label: "Genre",
      render: (row: AdminArtistListItem) => (
        <span className="admin-cell-muted">{row.genres[0] ?? "—"}</span>
      ),
    },
    {
      key: "city",
      label: "Ville",
      render: (row: AdminArtistListItem) => <span>{row.city ?? "—"}</span>,
    },
    {
      key: "tier",
      label: "Tier",
      render: (row: AdminArtistListItem) => (
        <span className={tierClassName(row.tier)}>{TIER_LABELS[row.tier]}</span>
      ),
    },
    {
      key: "creator_score",
      label: "Score",
      render: (row: AdminArtistListItem) => (
        <span className="admin-cell-score">{row.creator_score}/100</span>
      ),
    },
    {
      key: "total_streams",
      label: "Écoutes",
      render: (row: AdminArtistListItem) => (
        <span className="admin-cell-tabular">{row.total_streams.toLocaleString("fr-FR")}</span>
      ),
    },
    {
      key: "tracks_count",
      label: "Morceaux",
      render: (row: AdminArtistListItem) => <span>{row.tracks_count}</span>,
    },
    {
      key: "verification_status",
      label: "Vérification",
      render: (row: AdminArtistListItem) => {
        if (row.verification_status === "pending") {
          return (
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-primary"
                onClick={() => handleVerify(row.creator_id, true)}
              >
                ✅ Valider
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-danger"
                onClick={() => handleVerify(row.creator_id, false)}
                aria-label="Refuser"
              >
                ❌
              </button>
            </div>
          );
        }
        if (row.verified || row.verification_status === "approved") {
          return <AdminStatusBadge status="verified" />;
        }
        return <AdminStatusBadge status="pending" />;
      },
    },
    {
      key: "actions",
      label: "Actions",
      width: "220px",
      render: (row: AdminArtistListItem) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-ghost"
            onClick={() =>
              setExpandedArtist(expandedArtist === row.creator_id ? null : row.creator_id)
            }
            aria-label="Voir fiche"
          >
            👁
          </button>
          <select
            className="admin-tier-select"
            value={row.tier}
            onChange={(e) => handleChangeTier(row.creator_id, e.target.value as AdminCreatorTier)}
            aria-label="Changer le tier"
          >
            <option value="emergent">Émergent</option>
            <option value="croissance">Croissance</option>
            <option value="etabli">Établi</option>
          </select>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-warning"
            onClick={() =>
              setSelectedArtist({
                creatorId: row.creator_id,
                ownerId: row.owner_id,
                name: row.stage_name,
                action: "warn",
              })
            }
            aria-label="Avertir"
          >
            ⚠️
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-danger"
            onClick={() =>
              setSelectedArtist({
                creatorId: row.creator_id,
                ownerId: row.owner_id,
                name: row.stage_name,
                action: "suspend",
              })
            }
            aria-label="Suspendre"
          >
            ⏸
          </button>
        </div>
      ),
    },
  ];

  const filters: { key: AdminArtistsFilter; label: string }[] = [
    { key: "all", label: `Tous (${total.toLocaleString("fr-FR")})` },
    { key: "pending", label: "À vérifier" },
    { key: "verified", label: "Vérifiés" },
    { key: "tier_etabli", label: "Établis" },
    { key: "suspended", label: "Suspendus" },
  ];

  const totalPages = Math.ceil(total / limit);
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
        data={artists}
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
          {page > 1 ? (
            <a
              href={buildPageHref(page - 1, filterKey !== "all" ? filterKey : undefined, currentQuery)}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              ← Précédent
            </a>
          ) : null}
          <span className="admin-pagination-info">
            Page {page} / {totalPages} — {total.toLocaleString("fr-FR")} résultats
          </span>
          {page < totalPages ? (
            <a
              href={buildPageHref(page + 1, filterKey !== "all" ? filterKey : undefined, currentQuery)}
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
