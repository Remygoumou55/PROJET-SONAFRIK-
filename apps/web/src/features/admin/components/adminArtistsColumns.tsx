import Image from "next/image";
import type { AdminArtistListItem, AdminCreatorTier } from "@sonafrik/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
function isOptimizable(src: string): boolean {
  return SUPABASE_URL !== "" && src.startsWith(SUPABASE_URL);
}
import { AdminStatusBadge } from "./AdminStatusBadge";

export type ArtistAction = "warn" | "suspend" | "view" | null;

export interface SelectedArtist {
  creatorId: string;
  ownerId: string;
  name: string;
  action: ArtistAction;
}

interface ColumnsHandlers {
  expandedArtist: string | null;
  setExpandedArtist: (id: string | null) => void;
  setSelectedArtist: (s: SelectedArtist | null) => void;
  handleVerify: (creatorId: string, approved: boolean) => Promise<void>;
  handleChangeTier: (creatorId: string, newTier: AdminCreatorTier) => Promise<void>;
}

export const TIER_LABELS: Record<AdminCreatorTier, string> = {
  emergent: "Émergent",
  croissance: "Croissance",
  etabli: "Établi",
};

function tierClassName(tier: AdminCreatorTier): string {
  if (tier === "etabli") return "admin-tier-pill admin-tier-etabli";
  if (tier === "croissance") return "admin-tier-pill admin-tier-croissance";
  return "admin-tier-pill admin-tier-emergent";
}

export function buildAdminArtistsColumns({
  expandedArtist,
  setExpandedArtist,
  setSelectedArtist,
  handleVerify,
  handleChangeTier,
}: ColumnsHandlers) {
  return [
    {
      key: "stage_name",
      label: "Artiste",
      render: (row: AdminArtistListItem) => {
        const avatar = row.profile_photo ?? row.avatar_url;
        return (
          <div className="admin-artist-row">
            <div className="admin-artist-avatar">
              {avatar ? (
                <Image src={avatar} alt={row.stage_name} width={36} height={36} unoptimized={!isOptimizable(avatar)} />
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
}
