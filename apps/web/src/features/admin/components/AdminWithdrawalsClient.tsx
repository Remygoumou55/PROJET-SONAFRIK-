"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminPayoutEntry, WithdrawalStatus } from "@sonafrik/types";
import {
  PAYOUT_ACCOUNT_LABELS,
  WITHDRAWAL_STATUS_LABELS,
} from "@sonafrik/types";
import type { AdminWithdrawalsDashboardMeta } from "@sonafrik/api/admin";
import { formatGnf } from "@sonafrik/shared";
import { formatDateTime } from "@/lib/formatters";
import { AdminTable } from "./AdminTable";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { AdminReasonModal } from "./AdminReasonModal";
import {
  adminApproveWithdrawalAction,
  adminRejectWithdrawalAction,
} from "../actions/admin-financial.actions";

type WithdrawalFilter = WithdrawalStatus | "all";

type WithdrawalRow = AdminPayoutEntry & Record<string, unknown>;

interface Props extends AdminWithdrawalsDashboardMeta {
  withdrawals: AdminPayoutEntry[];
  walletBalances: Record<string, number>;
}

const LARGE_WITHDRAWAL_GNF = 1_000_000;
const OVERDUE_HOURS = 48;

const FILTERS: { key: WithdrawalFilter; label: string }[] = [
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Approuvés" },
  { key: "processing", label: "En cours" },
  { key: "completed", label: "Versés" },
  { key: "cancelled", label: "Refusés" },
  { key: "all", label: "Tous" },
];

interface SelectedWithdrawal {
  id: string;
  artistName: string;
  amount: number;
  method: string;
  action: "approve" | "reject";
}

export function AdminWithdrawalsClient({
  withdrawals,
  walletBalances,
  total,
  page,
  limit,
  currentFilter,
  alerts,
}: Props) {
  const [selected, setSelected] = useState<SelectedWithdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleApprove = async () => {
    if (!selected || selected.action !== "approve") return;
    setActionError(null);
    const result = await adminApproveWithdrawalAction(selected.id);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setSelected(null);
    startTransition(() => router.refresh());
  };

  const handleReject = async () => {
    if (!selected || selected.action !== "reject") return;
    setActionError(null);
    const result = await adminRejectWithdrawalAction(selected.id, rejectReason);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setSelected(null);
    setRejectReason("");
    startTransition(() => router.refresh());
  };

  const columns = [
    {
      key: "artist",
      label: "Artiste",
      render: (row: WithdrawalRow) => (
        <div>
          <p className="admin-td-strong">{row.payout_account.display_name}</p>
          <p className="admin-td-muted">{row.user_email ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "amount_gnf",
      label: "Montant",
      render: (row: WithdrawalRow) => {
        const isLarge = row.net_amount_gnf >= LARGE_WITHDRAWAL_GNF;
        return (
          <div>
            <p className={`admin-td-strong ${isLarge ? "admin-td-warning" : "admin-td-success"}`}>
              {formatGnf(row.net_amount_gnf)}
            </p>
            {isLarge && <p className="admin-td-warning-sm">Gros retrait</p>}
          </div>
        );
      },
    },
    {
      key: "method",
      label: "Méthode",
      render: (row: WithdrawalRow) => (
        <span>{PAYOUT_ACCOUNT_LABELS[row.payout_account.type] ?? row.payout_account.type}</span>
      ),
    },
    {
      key: "phone",
      label: "Numéro / IBAN",
      render: (row: WithdrawalRow) => (
        <span className="admin-mono">
          {row.payout_account.phone_number ?? row.payout_account.iban ?? "—"}
        </span>
      ),
    },
    {
      key: "balance",
      label: "Solde artiste",
      render: (row: WithdrawalRow) => (
        <span className="admin-td-muted">{formatGnf(walletBalances[row.user_id] ?? 0)}</span>
      ),
    },
    {
      key: "requested_at",
      label: "Demandé le",
      render: (row: WithdrawalRow) => {
        const hoursAgo = Math.floor(
          (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60),
        );
        const isOverdue = hoursAgo > OVERDUE_HOURS && row.status === "pending";
        return (
          <div>
            <p className={isOverdue ? "admin-td-warning" : "admin-td-muted"}>
              {formatDateTime(row.created_at)}
            </p>
            {isOverdue && <p className="admin-td-warning-sm">{hoursAgo}h en attente</p>}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Statut",
      render: (row: WithdrawalRow) => (
        <span className={`admin-status-badge badge-${row.status}`}>
          {WITHDRAWAL_STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "180px",
      render: (row: WithdrawalRow) => {
        if (row.status !== "pending") {
          return (
            <span className="admin-td-muted-sm">
              {row.processed_at ? formatDateTime(row.processed_at) : "—"}
            </span>
          );
        }
        return (
          <div className="admin-moderation-actions">
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-primary"
              onClick={() =>
                setSelected({
                  id: row.id,
                  artistName: row.payout_account.display_name,
                  amount: row.net_amount_gnf,
                  method: row.payout_account.type,
                  action: "approve",
                })
              }
            >
              Approuver
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-danger"
              onClick={() =>
                setSelected({
                  id: row.id,
                  artistName: row.payout_account.display_name,
                  amount: row.net_amount_gnf,
                  method: row.payout_account.type,
                  action: "reject",
                })
              }
            >
              Refuser
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="admin-dashboard admin-withdrawals-module">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Retraits</h1>
        <p className="admin-page-sub">
          {total.toLocaleString("fr-FR")} demande{total > 1 ? "s" : ""} de retrait
        </p>
      </div>

      {actionError && (
        <p className="admin-inline-alert admin-inline-alert--error">{actionError}</p>
      )}

      <div className="admin-kpis-grid admin-kpis-grid--3">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>
              ⏳
            </span>
          </div>
          <p className="admin-kpi-value">{formatGnf(alerts.totalPendingAmount)}</p>
          <p className="admin-kpi-title">Total en attente</p>
          <p className="admin-kpi-sub">à verser aux artistes</p>
        </div>

        <div
          className={`admin-kpi-card ${alerts.largeWithdrawals.length > 0 ? "admin-kpi-card--warning" : ""}`}
        >
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>
              ⚠️
            </span>
          </div>
          <p
            className={`admin-kpi-value ${alerts.largeWithdrawals.length > 0 ? "admin-kpi-value--warning" : ""}`}
          >
            {alerts.largeWithdrawals.length}
          </p>
          <p className="admin-kpi-title">Gros retraits</p>
          <p className="admin-kpi-sub">&gt; 1 000 000 GNF — vérification requise</p>
        </div>

        <div
          className={`admin-kpi-card ${alerts.overdueCount > 0 ? "admin-kpi-card--warning" : ""}`}
        >
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>
              🕐
            </span>
          </div>
          <p
            className={`admin-kpi-value ${alerts.overdueCount > 0 ? "admin-kpi-value--warning" : ""}`}
          >
            {alerts.overdueCount}
          </p>
          <p className="admin-kpi-title">En retard</p>
          <p className="admin-kpi-sub">en attente depuis plus de 48h</p>
        </div>
      </div>

      {alerts.largeWithdrawals.length > 0 && (
        <div className="admin-alerts-bar admin-alerts-bar--warning">
          <span className="admin-alerts-icon" aria-hidden>
            ⚠️
          </span>
          <span className="admin-alerts-text">
            {alerts.largeWithdrawals.length} retrait{alerts.largeWithdrawals.length > 1 ? "s" : ""}{" "}
            &gt; 1 000 000 GNF nécessitent une vérification manuelle du numéro avant approbation.
          </span>
        </div>
      )}

      <div className="admin-toolbar">
        <div className="admin-filters">
          {FILTERS.map((filter) => (
            <a
              key={filter.key}
              href={`/admin/withdrawals?filter=${filter.key}`}
              className={`admin-filter-btn ${currentFilter === filter.key ? "active" : ""}`}
            >
              {filter.key === "all" ? `${filter.label} (${total})` : filter.label}
            </a>
          ))}
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={withdrawals as WithdrawalRow[]}
        keyField="id"
        emptyMessage="Aucun retrait pour ce filtre."
      />

      {totalPages > 1 && (
        <div className="admin-pagination">
          {page > 1 && (
            <a
              href={`/admin/withdrawals?filter=${currentFilter}&page=${page - 1}`}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              ← Précédent
            </a>
          )}
          <span className="admin-pagination-info">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/withdrawals?filter=${currentFilter}&page=${page + 1}`}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              Suivant →
            </a>
          )}
        </div>
      )}

      {selected?.action === "approve" && (
        <AdminConfirmModal
          isOpen
          title={`Approuver le retrait de ${selected.artistName}`}
          description={`Vous allez approuver un retrait de ${formatGnf(selected.amount)} via ${PAYOUT_ACCOUNT_LABELS[selected.method as keyof typeof PAYOUT_ACCOUNT_LABELS] ?? selected.method}. Vérifiez le numéro de destination avant de confirmer.`}
          confirmText="APPROUVER"
          confirmLabel="Confirmer l'approbation"
          onConfirm={handleApprove}
          onCancel={() => setSelected(null)}
        />
      )}

      {selected?.action === "reject" && (
        <AdminReasonModal
          title={`Refuser le retrait de ${selected.artistName}`}
          placeholder="Motif du refus (obligatoire) — ex: numéro Orange Money invalide"
          confirmLabel="Refuser le retrait"
          value={rejectReason}
          onChange={setRejectReason}
          onConfirm={() => void handleReject()}
          onCancel={() => {
            setSelected(null);
            setRejectReason("");
          }}
          danger
        />
      )}
    </div>
  );
}
