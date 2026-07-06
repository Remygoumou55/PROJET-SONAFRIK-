"use client";

import { useState } from "react";
import type { AdminAccountStatus, AdminUserListItem, AdminUsersFilter } from "@sonafrik/types";
import {
  adminDeleteUserAction,
  adminSuspendUserAction,
  adminWarnUserAction,
} from "@/features/admin/actions/admin-moderation.actions";
import { ADMIN_LDSE_EVENTS } from "@/features/shared/ldse/admin/admin-ldse-config";
import { publishAdminLdseEvent } from "@/features/shared/ldse/admin/AdminLdseProvider";
import { useAdminUsersSrtspLive } from "../hooks/useAdminUsersSrtspLive";
import { AdminTable } from "./AdminTable";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminSearchBar } from "./AdminSearchBar";
import { AdminConfirmModal } from "./AdminConfirmModal";

type ActionType = "warn" | "suspend" | "delete" | null;

interface SelectedUser {
  id: string;
  name: string;
  action: ActionType;
}

interface AdminUsersClientProps {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  currentFilter?: AdminUsersFilter;
  currentQuery?: string;
}

function resolveStatusBadge(user: AdminUserListItem): AdminAccountStatus | "premium" {
  if (user.is_premium && user.account_status === "active") return "premium";
  return user.account_status;
}

function buildPageHref(
  page: number,
  filter?: string,
  query?: string,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filter && filter !== "all") params.set("filter", filter);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

export function AdminUsersClient({
  users,
  total,
  page,
  limit,
  currentFilter,
  currentQuery,
}: AdminUsersClientProps) {
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const live = useAdminUsersSrtspLive({
    initialData: { users, total, page, limit },
    filter: currentFilter,
    query: currentQuery,
    page,
  });
  const liveUsers = live.data?.users ?? users;
  const liveTotal = live.data?.total ?? total;
  const livePage = live.data?.page ?? page;
  const liveLimit = live.data?.limit ?? limit;

  const handleAction = (userId: string, userName: string, action: ActionType) => {
    setActionError(null);
    setSelectedUser({ id: userId, name: userName, action });
  };

  const executeAction = async () => {
    if (!selectedUser?.action) return;
    setActionError(null);

    let result: { error?: string };
    if (selectedUser.action === "warn") {
      result = await adminWarnUserAction({
        userId: selectedUser.id,
        adminNote: `Avertissement envoyé à ${selectedUser.name}`,
      });
    } else if (selectedUser.action === "suspend") {
      result = await adminSuspendUserAction({ userId: selectedUser.id });
    } else {
      result = await adminDeleteUserAction({ userId: selectedUser.id });
    }

    if (result.error) {
      setActionError(result.error);
      return;
    }

    setSelectedUser(null);
    publishAdminLdseEvent(ADMIN_LDSE_EVENTS.userUpdated, { userId: selectedUser.id });
  };

  const columns = [
    {
      key: "full_name",
      label: "Nom complet",
      render: (row: AdminUserListItem) => (
        <div>
          <p className="admin-cell-primary">{row.full_name ?? "—"}</p>
          <p className="admin-cell-secondary">{row.phone ?? row.email ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Téléphone",
      render: (row: AdminUserListItem) => (
        <span className="admin-cell-mono">{row.phone ?? "—"}</span>
      ),
    },
    {
      key: "city",
      label: "Ville",
      render: (row: AdminUserListItem) => <span>{row.city ?? "—"}</span>,
    },
    {
      key: "is_premium",
      label: "Abonnement",
      render: (row: AdminUserListItem) => (
        <AdminStatusBadge status={resolveStatusBadge(row)} />
      ),
    },
    {
      key: "created_at",
      label: "Inscription",
      render: (row: AdminUserListItem) => (
        <span className="admin-cell-muted">
          {new Date(row.created_at).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "last_seen_at",
      label: "Dernière connexion",
      render: (row: AdminUserListItem) => (
        <span className="admin-cell-muted">
          {row.last_seen_at
            ? new Date(row.last_seen_at).toLocaleDateString("fr-FR")
            : "Jamais"}
        </span>
      ),
    },
    {
      key: "account_status",
      label: "Statut",
      render: (row: AdminUserListItem) => (
        <AdminStatusBadge status={row.account_status} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "200px",
      render: (row: AdminUserListItem) => (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-ghost"
            onClick={() => setExpandedUser(expandedUser === row.id ? null : row.id)}
            aria-label="Voir le profil"
          >
            👁 Voir
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-warning"
            onClick={() => handleAction(row.id, row.full_name ?? "cet utilisateur", "warn")}
            aria-label="Avertir"
          >
            ⚠️
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-ghost"
            onClick={() => handleAction(row.id, row.full_name ?? "cet utilisateur", "suspend")}
            aria-label="Suspendre"
          >
            ⏸
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-danger"
            onClick={() => handleAction(row.id, row.full_name ?? "cet utilisateur", "delete")}
            aria-label="Supprimer"
          >
            🗑
          </button>
        </div>
      ),
    },
  ];

  const filters: { key: AdminUsersFilter; label: string }[] = [
    { key: "all", label: `Tous (${liveTotal.toLocaleString("fr-FR")})` },
    { key: "premium", label: "Premium" },
    { key: "suspended", label: "Suspendus" },
    { key: "new", label: "Nouveaux (7j)" },
  ];

  const totalPages = Math.ceil(liveTotal / liveLimit);
  const filterKey = currentFilter ?? "all";
  const confirmFirstName = (selectedUser?.name ?? "CONFIRMER").split(" ")[0]?.toUpperCase() ?? "CONFIRMER";

  return (
    <>
      <div className="admin-toolbar">
        <AdminSearchBar placeholder="Rechercher par nom, téléphone, email..." />
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
        data={liveUsers}
        keyField="id"
        emptyMessage="Aucun utilisateur trouvé pour ces critères."
        expandedRowKey={expandedUser}
        renderExpandedRow={(user) => (
          <div className="admin-user-detail">
            <div className="admin-user-detail-grid">
              <div>
                <p className="admin-user-detail-label">Email</p>
                <p className="admin-user-detail-value">{user.email ?? "—"}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">Pays</p>
                <p className="admin-user-detail-value">{user.country_code ?? "—"}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">Avertissements</p>
                <p className="admin-user-detail-value">{user.warning_count}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">Score fraude</p>
                <p className="admin-user-detail-value">{user.fraud_score}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">Sessions d&apos;écoute</p>
                <p className="admin-user-detail-value">{user.stream_sessions_count}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">Premium expire</p>
                <p className="admin-user-detail-value">
                  {user.premium_expires_at
                    ? new Date(user.premium_expires_at).toLocaleDateString("fr-FR")
                    : "—"}
                </p>
              </div>
              {user.suspended_until ? (
                <div>
                  <p className="admin-user-detail-label">Suspendu jusqu&apos;au</p>
                  <p className="admin-user-detail-value">
                    {new Date(user.suspended_until).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ) : null}
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

      {selectedUser ? (
        <AdminConfirmModal
          isOpen
          title={
            selectedUser.action === "warn"
              ? `Avertir ${selectedUser.name}`
              : selectedUser.action === "suspend"
                ? `Suspendre ${selectedUser.name}`
                : `Supprimer définitivement ${selectedUser.name}`
          }
          description={
            selectedUser.action === "warn"
              ? `Un avertissement sera envoyé à ${selectedUser.name}. Cette action sera enregistrée dans le journal d'audit.`
              : selectedUser.action === "suspend"
                ? `Le compte de ${selectedUser.name} sera suspendu pendant 30 jours. L'utilisateur ne pourra plus se connecter.`
                : `Le compte de ${selectedUser.name} sera supprimé définitivement (soft delete). Cette action est IRRÉVERSIBLE.`
          }
          confirmText={selectedUser.action === "delete" ? "CONFIRMER" : confirmFirstName}
          confirmLabel={
            selectedUser.action === "warn"
              ? "Envoyer l'avertissement"
              : selectedUser.action === "suspend"
                ? "Suspendre le compte"
                : "Supprimer définitivement"
          }
          isDanger={selectedUser.action === "delete" || selectedUser.action === "suspend"}
          onConfirm={executeAction}
          onCancel={() => setSelectedUser(null)}
        />
      ) : null}
    </>
  );
}
