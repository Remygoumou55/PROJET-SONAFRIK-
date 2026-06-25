"use client";

import { useState, useCallback } from "react";
import type { AdminPayoutEntry, WithdrawalStatus } from "@sonafrik/types";
import { PAYOUT_ACCOUNT_LABELS, WITHDRAWAL_STATUS_LABELS, PAYOUT_ENGINE_ERROR_MESSAGES } from "@sonafrik/types";
import { usePayoutService } from "../hooks/usePayoutService";
import { formatGnf } from "@sonafrik/shared";
import { formatDateTime } from "@/lib/formatters";
import { AdminActionBtn } from "./AdminActionBtn";
import { AdminPayoutModal } from "./AdminPayoutModal";
import { AdminRoyaltyPanel } from "./AdminRoyaltyPanel";
import type { RoyaltyCycle } from "@sonafrik/types";

type StatusFilter = "pending" | "approved" | "processing" | "completed" | "cancelled" | "all";

const STATUS_COLORS: Record<WithdrawalStatus, { bg: string; text: string }> = {
  pending:    { bg: "rgba(255,194,14,0.13)",  text: "var(--color-or-solaire)" },
  approved:   { bg: "rgba(59,130,246,0.13)",  text: "var(--color-accent-bleu-clair)" },
  processing: { bg: "rgba(245,158,11,0.13)",  text: "var(--color-avertissement)" },
  completed:  { bg: "rgba(0,210,106,0.13)",   text: "var(--color-vert-energie)" },
  failed:     { bg: "rgba(255,68,68,0.13)",   text: "var(--color-erreur)" },
  cancelled:  { bg: "rgba(85,85,85,0.13)",    text: "var(--color-texte-desactive)" },
};

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "En attente",  value: "pending" },
  { label: "Approuvés",   value: "approved" },
  { label: "En cours",    value: "processing" },
  { label: "Effectués",   value: "completed" },
  { label: "Annulés",     value: "cancelled" },
  { label: "Tout",        value: "all" },
];

interface Props {
  initialQueue: AdminPayoutEntry[];
  initialRoyaltyCycles: RoyaltyCycle[];
}

export function AdminFinanceCenter({ initialQueue, initialRoyaltyCycles }: Props) {
  const service = usePayoutService();
  const [queue, setQueue] = useState<AdminPayoutEntry[]>(initialQueue);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ type: "reject" | "mark_paid"; withdrawalId: string; value: string } | null>(null);

  const fetchQueue = useCallback(async (status: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.getAdminPayoutQueue({ status, limit: 100 });
      setQueue(data);
    } catch {
      setError("Impossible de charger la file.");
    } finally {
      setLoading(false);
    }
  }, [service]);

  const runAction = async (withdrawalId: string, fn: () => Promise<unknown>) => {
    setActionState((prev) => ({ ...prev, [withdrawalId]: true }));
    setError(null);
    try {
      await fn();
      await fetchQueue(statusFilter);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(PAYOUT_ENGINE_ERROR_MESSAGES[msg] ?? PAYOUT_ENGINE_ERROR_MESSAGES["unknown"] ?? "Une erreur est survenue.");
    } finally {
      setActionState((prev) => ({ ...prev, [withdrawalId]: false }));
    }
  };

  const handleFilterChange = (s: StatusFilter) => { setStatusFilter(s); void fetchQueue(s); };
  const handleApprove = (id: string) => void runAction(id, () => service.approvePayoutRequest({ withdrawalId: id }));
  const handleReject  = (id: string) => setModal({ type: "reject", withdrawalId: id, value: "" });
  const handleProcess = (id: string) => void runAction(id, () => service.processPayoutRequest({ withdrawalId: id }));
  const handleMarkPaid = (id: string) => setModal({ type: "mark_paid", withdrawalId: id, value: "" });
  const handleCancel  = (id: string) => void runAction(id, () => service.cancelPayoutRequest({ withdrawalId: id }));

  const confirmModal = () => {
    if (!modal) return;
    const { type, withdrawalId, value } = modal;
    setModal(null);
    if (type === "reject") {
      void runAction(withdrawalId, () => service.rejectPayoutRequest({ withdrawalId, reason: value }));
    } else {
      void runAction(withdrawalId, () => service.markPayoutPaid({ withdrawalId, reference: value }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ color: "var(--color-texte-principal)" }} className="text-2xl font-bold">Finance Center</h1>
        <p style={{ color: "var(--color-texte-secondaire)" }} className="mt-1 text-sm">Gestion des demandes de retrait créateurs</p>
      </div>

      <AdminRoyaltyPanel initialCycles={initialRoyaltyCycles} />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: statusFilter === f.value ? "var(--color-vert-energie)" : "var(--color-card)",
              color: statusFilter === f.value ? "var(--color-noir-profond)" : "var(--color-texte-secondaire)",
              border: `1px solid ${statusFilter === f.value ? "var(--color-vert-energie)" : "var(--color-bordure)"}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-erreur)" }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse motion-reduce:animate-none rounded-xl p-5" style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 80}ms` }}>
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
                  <div className="h-3 w-24 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
                </div>
                <div className="h-6 w-20 rounded-full" style={{ backgroundColor: "var(--color-elevated)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: "var(--color-card)" }}>
          <p className="text-2xl">✅</p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-texte-secondaire)" }}>Aucune demande dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((entry) => {
            const busy = actionState[entry.id] ?? false;
            const sc   = STATUS_COLORS[entry.status] ?? STATUS_COLORS.pending;
            return (
              <div key={entry.id} className="rounded-xl p-5" style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-bordure)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>{formatGnf(entry.net_amount_gnf)}</p>
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: sc.bg, color: sc.text }}>
                        {WITHDRAWAL_STATUS_LABELS[entry.status] ?? entry.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-texte-secondaire)" }}>
                      {entry.user_email ?? entry.user_id.slice(0, 8)} · {PAYOUT_ACCOUNT_LABELS[entry.payout_account.type]} · {entry.payout_account.display_name}
                      {entry.payout_account.phone_number ? ` · ${entry.payout_account.phone_number}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-texte-secondaire)" }}>Demandé le {formatDateTime(entry.created_at)}</p>
                    {entry.reference && <p className="mt-0.5 text-xs" style={{ color: "var(--color-vert-energie)" }}>Réf: {entry.reference}</p>}
                    {entry.rejection_reason && <p className="mt-0.5 text-xs" style={{ color: "var(--color-erreur)" }}>Motif: {entry.rejection_reason}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.status === "pending" && (
                      <>
                        <AdminActionBtn label="Approuver" color="var(--color-vert-energie)" textColor="var(--color-noir-profond)" disabled={busy} onClick={() => handleApprove(entry.id)} />
                        <AdminActionBtn label="Rejeter" color="rgba(255,68,68,0.13)" textColor="var(--color-erreur)" disabled={busy} onClick={() => handleReject(entry.id)} />
                      </>
                    )}
                    {entry.status === "approved" && (
                      <>
                        <AdminActionBtn label="Traiter" color="rgba(59,130,246,0.13)" textColor="var(--color-accent-bleu-clair)" disabled={busy} onClick={() => handleProcess(entry.id)} />
                        <AdminActionBtn label="Annuler" color="rgba(85,85,85,0.13)" textColor="var(--color-texte-desactive)" disabled={busy} onClick={() => handleCancel(entry.id)} />
                      </>
                    )}
                    {entry.status === "processing" && (
                      <>
                        <AdminActionBtn label="Marquer payé" color="rgba(0,210,106,0.13)" textColor="var(--color-vert-energie)" disabled={busy} onClick={() => handleMarkPaid(entry.id)} />
                        <AdminActionBtn label="Annuler" color="rgba(85,85,85,0.13)" textColor="var(--color-texte-desactive)" disabled={busy} onClick={() => handleCancel(entry.id)} />
                      </>
                    )}
                    {busy && <span className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>…</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <AdminPayoutModal
          type={modal.type}
          value={modal.value}
          onChange={(v) => setModal({ ...modal, value: v })}
          onConfirm={confirmModal}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
