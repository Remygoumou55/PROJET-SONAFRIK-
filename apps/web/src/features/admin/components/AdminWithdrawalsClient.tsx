"use client";

import { useState } from "react";
import type { AdminPayoutEntry } from "@sonafrik/types";
import { PAYOUT_ACCOUNT_LABELS } from "@sonafrik/types";
import type { AdminWithdrawalsDashboardMeta } from "@sonafrik/api/admin";
import { formatGnf } from "@sonafrik/shared";
import { AdminTable } from "./AdminTable";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { AdminReasonModal } from "./AdminReasonModal";
import {
  adminApproveWithdrawalAction,
  adminRejectWithdrawalAction,
} from "../actions/admin-financial.actions";
import { publishAdminLdseEvent } from "@/features/shared/ldse/admin/AdminLdseProvider";
import { ADMIN_LDSE_EVENTS } from "@/features/shared/ldse/admin/admin-ldse-config";
import { useAdminWithdrawalsSrtspLive } from "../hooks/useAdminWithdrawalsSrtspLive";
import {
  buildAdminWithdrawalsColumns,
  FILTERS,
  type SelectedWithdrawal,
  type WithdrawalRow,
} from "./adminWithdrawalsColumns";

interface Props extends AdminWithdrawalsDashboardMeta {
  withdrawals: AdminPayoutEntry[];
  walletBalances: Record<string, number>;
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

  const live = useAdminWithdrawalsSrtspLive({
    initialData: { queue: withdrawals },
    status: currentFilter,
  });
  const liveWithdrawals = live.data?.queue ?? withdrawals;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleApprove = async () => {
    if (!selected || selected.action !== "approve") return;
    setActionError(null);
    const result = await adminApproveWithdrawalAction(selected.id);
    if (result.error) { setActionError(result.error); return; }
    publishAdminLdseEvent(ADMIN_LDSE_EVENTS.withdrawalUpdated, { withdrawalId: selected.id, action: "approve" });
    setSelected(null);
  };

  const handleReject = async () => {
    if (!selected || selected.action !== "reject") return;
    setActionError(null);
    const result = await adminRejectWithdrawalAction(selected.id, rejectReason);
    if (result.error) { setActionError(result.error); return; }
    publishAdminLdseEvent(ADMIN_LDSE_EVENTS.withdrawalUpdated, { withdrawalId: selected.id, action: "reject" });
    setSelected(null);
    setRejectReason("");
  };

  const columns = buildAdminWithdrawalsColumns({ walletBalances, setSelected });

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
            <span className="admin-kpi-icon" aria-hidden>⏳</span>
          </div>
          <p className="admin-kpi-value">{formatGnf(alerts.totalPendingAmount)}</p>
          <p className="admin-kpi-title">Total en attente</p>
          <p className="admin-kpi-sub">à verser aux artistes</p>
        </div>

        <div className={`admin-kpi-card ${alerts.largeWithdrawals.length > 0 ? "admin-kpi-card--warning" : ""}`}>
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>⚠️</span>
          </div>
          <p className={`admin-kpi-value ${alerts.largeWithdrawals.length > 0 ? "admin-kpi-value--warning" : ""}`}>
            {alerts.largeWithdrawals.length}
          </p>
          <p className="admin-kpi-title">Gros retraits</p>
          <p className="admin-kpi-sub">&gt; 1 000 000 GNF — vérification requise</p>
        </div>

        <div className={`admin-kpi-card ${alerts.overdueCount > 0 ? "admin-kpi-card--warning" : ""}`}>
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>🕐</span>
          </div>
          <p className={`admin-kpi-value ${alerts.overdueCount > 0 ? "admin-kpi-value--warning" : ""}`}>
            {alerts.overdueCount}
          </p>
          <p className="admin-kpi-title">En retard</p>
          <p className="admin-kpi-sub">en attente depuis plus de 48h</p>
        </div>
      </div>

      {alerts.largeWithdrawals.length > 0 && (
        <div className="admin-alerts-bar admin-alerts-bar--warning">
          <span className="admin-alerts-icon" aria-hidden>⚠️</span>
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
        data={liveWithdrawals as WithdrawalRow[]}
        keyField="id"
        emptyMessage="Aucun retrait pour ce filtre."
      />

      {totalPages > 1 && (
        <div className="admin-pagination">
          {page > 1 && (
            <a href={`/admin/withdrawals?filter=${currentFilter}&page=${page - 1}`} className="admin-btn admin-btn-ghost admin-btn-sm">
              ← Précédent
            </a>
          )}
          <span className="admin-pagination-info">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <a href={`/admin/withdrawals?filter=${currentFilter}&page=${page + 1}`} className="admin-btn admin-btn-ghost admin-btn-sm">
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
          onCancel={() => { setSelected(null); setRejectReason(""); }}
          danger
        />
      )}
    </div>
  );
}
