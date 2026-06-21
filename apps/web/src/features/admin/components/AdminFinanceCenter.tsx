"use client";

import { useState, useCallback, useMemo } from "react";
import type { AdminPayoutEntry, WithdrawalStatus } from "@sonafrik/types";
import { PAYOUT_ACCOUNT_LABELS, WITHDRAWAL_STATUS_LABELS, PAYOUT_ENGINE_ERROR_MESSAGES } from "@sonafrik/types";
import { createPayoutService } from "@sonafrik/api/payout";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatGnf, formatDateTime } from "@/lib/formatters";

type StatusFilter = "pending" | "approved" | "processing" | "completed" | "cancelled" | "all";

const STATUS_COLORS: Record<WithdrawalStatus, { bg: string; text: string }> = {
  pending:    { bg: "rgba(255,194,14,0.13)",  text: "var(--color-or-solaire)" },
  approved:   { bg: "rgba(59,130,246,0.13)",  text: "#60A5FA" },
  processing: { bg: "rgba(245,158,11,0.13)",  text: "#F59E0B" },
  completed:  { bg: "rgba(0,210,106,0.13)",   text: "var(--color-vert-energie)" },
  failed:     { bg: "rgba(255,68,68,0.13)",   text: "var(--color-erreur)" },
  cancelled:  { bg: "rgba(85,85,85,0.13)",    text: "var(--color-texte-desactive)" },
};

interface Props {
  initialQueue: AdminPayoutEntry[];
}

export function AdminFinanceCenter({ initialQueue }: Props) {
  const service = useMemo(() => createPayoutService(getSupabaseBrowserClient()), []);
  const [queue, setQueue] = useState<AdminPayoutEntry[]>(initialQueue);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, boolean>>({});

  // Modal state for reject/mark_paid
  const [modal, setModal] = useState<{
    type: "reject" | "mark_paid";
    withdrawalId: string;
    value: string;
  } | null>(null);

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

  const handleFilterChange = (s: StatusFilter) => {
    setStatusFilter(s);
    void fetchQueue(s);
  };

  const runAction = async (
    withdrawalId: string,
    fn: () => Promise<unknown>,
  ) => {
    setActionState((prev) => ({ ...prev, [withdrawalId]: true }));
    setError(null);
    try {
      await fn();
      await fetchQueue(statusFilter);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        PAYOUT_ENGINE_ERROR_MESSAGES[msg] ??
          PAYOUT_ENGINE_ERROR_MESSAGES["unknown"] ??
          "Une erreur est survenue.",
      );
    } finally {
      setActionState((prev) => ({ ...prev, [withdrawalId]: false }));
    }
  };

  const handleApprove = (id: string) => {
    void runAction(id, () => service.approvePayoutRequest({ withdrawalId: id }));
  };

  const handleReject = (id: string) => {
    setModal({ type: "reject", withdrawalId: id, value: "" });
  };

  const handleProcess = (id: string) => {
    void runAction(id, () => service.processPayoutRequest({ withdrawalId: id }));
  };

  const handleMarkPaid = (id: string) => {
    setModal({ type: "mark_paid", withdrawalId: id, value: "" });
  };

  const handleCancel = (id: string) => {
    void runAction(id, () => service.cancelPayoutRequest({ withdrawalId: id }));
  };

  const confirmModal = () => {
    if (!modal) return;
    const { type, withdrawalId, value } = modal;
    setModal(null);
    if (type === "reject") {
      void runAction(withdrawalId, () =>
        service.rejectPayoutRequest({ withdrawalId, reason: value }),
      );
    } else {
      void runAction(withdrawalId, () =>
        service.markPayoutPaid({ withdrawalId, reference: value }),
      );
    }
  };

  const FILTERS: { label: string; value: StatusFilter }[] = [
    { label: "En attente",  value: "pending" },
    { label: "Approuvés",   value: "approved" },
    { label: "En cours",    value: "processing" },
    { label: "Effectués",   value: "completed" },
    { label: "Annulés",     value: "cancelled" },
    { label: "Tout",        value: "all" },
  ];

  const cardBg  = "var(--color-card)";
  const border  = "var(--color-bordure)";
  const textMain = "var(--color-texte-principal)";
  const textSub  = "var(--color-texte-secondaire)";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ color: textMain }} className="text-2xl font-bold">
          Finance Center
        </h1>
        <p style={{ color: textSub }} className="mt-1 text-sm">
          Gestion des demandes de retrait créateurs
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: statusFilter === f.value ? "var(--color-vert-energie)" : cardBg,
              color: statusFilter === f.value ? "var(--color-noir-profond)" : textSub,
              border: `1px solid ${statusFilter === f.value ? "var(--color-vert-energie)" : border}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-erreur)" }}>
          {error}
        </p>
      )}

      {/* Queue */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse motion-reduce:animate-none rounded-xl p-5"
              style={{ backgroundColor: cardBg, animationDelay: `${i * 80}ms` }}
            >
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
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: cardBg }}>
          <p className="text-2xl">✅</p>
          <p className="mt-2 text-sm" style={{ color: textSub }}>
            Aucune demande dans cette catégorie.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((entry) => {
            const busy = actionState[entry.id] ?? false;
            const sc   = STATUS_COLORS[entry.status] ?? STATUS_COLORS.pending;
            return (
              <div
                key={entry.id}
                className="rounded-xl p-5"
                style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
              >
                {/* Top row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: textMain }}>
                        {formatGnf(entry.net_amount_gnf)}
                      </p>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: sc.bg, color: sc.text }}
                      >
                        {WITHDRAWAL_STATUS_LABELS[entry.status] ?? entry.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: textSub }}>
                      {entry.user_email ?? entry.user_id.slice(0, 8)} ·{" "}
                      {PAYOUT_ACCOUNT_LABELS[entry.payout_account.type]} ·{" "}
                      {entry.payout_account.display_name}
                      {entry.payout_account.phone_number
                        ? ` · ${entry.payout_account.phone_number}`
                        : ""}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: textSub }}>
                      Demandé le {formatDateTime(entry.created_at)}
                    </p>
                    {entry.reference && (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--color-vert-energie)" }}>
                        Réf: {entry.reference}
                      </p>
                    )}
                    {entry.rejection_reason && (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--color-erreur)" }}>
                        Motif: {entry.rejection_reason}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {entry.status === "pending" && (
                      <>
                        <ActionBtn
                          label="Approuver"
                          color="var(--color-vert-energie)"
                          textColor="var(--color-noir-profond)"
                          disabled={busy}
                          onClick={() => handleApprove(entry.id)}
                        />
                        <ActionBtn
                          label="Rejeter"
                          color="rgba(255,68,68,0.13)"
                          textColor="var(--color-erreur)"
                          disabled={busy}
                          onClick={() => handleReject(entry.id)}
                        />
                      </>
                    )}
                    {entry.status === "approved" && (
                      <>
                        <ActionBtn
                          label="Traiter"
                          color="rgba(59,130,246,0.13)"
                          textColor="#60A5FA"
                          disabled={busy}
                          onClick={() => handleProcess(entry.id)}
                        />
                        <ActionBtn
                          label="Annuler"
                          color="rgba(85,85,85,0.13)"
                          textColor="var(--color-texte-desactive)"
                          disabled={busy}
                          onClick={() => handleCancel(entry.id)}
                        />
                      </>
                    )}
                    {entry.status === "processing" && (
                      <>
                        <ActionBtn
                          label="Marquer payé"
                          color="rgba(0,210,106,0.13)"
                          textColor="var(--color-vert-energie)"
                          disabled={busy}
                          onClick={() => handleMarkPaid(entry.id)}
                        />
                        <ActionBtn
                          label="Annuler"
                          color="rgba(85,85,85,0.13)"
                          textColor="var(--color-texte-desactive)"
                          disabled={busy}
                          onClick={() => handleCancel(entry.id)}
                        />
                      </>
                    )}
                    {busy && (
                      <span className="text-xs" style={{ color: textSub }}>
                        …
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: reject or mark_paid */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl p-6"
            style={{ backgroundColor: "var(--color-card)", border: `1px solid ${border}` }}
          >
            <h3 className="text-base font-semibold" style={{ color: textMain }}>
              {modal.type === "reject" ? "Motif de rejet" : "Référence de paiement"}
            </h3>
            <input
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: "var(--color-elevated)",
                border: `1px solid ${border}`,
                color: textMain,
              }}
              placeholder={
                modal.type === "reject"
                  ? "Ex: Compte invalide, numéro incorrect…"
                  : "Ex: OM-20260612-001"
              }
              value={modal.value}
              onChange={(e) => setModal({ ...modal, value: e.target.value })}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmModal}
                disabled={!modal.value.trim()}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
              >
                Confirmer
              </button>
              <button
                onClick={() => setModal(null)}
                className="rounded-xl px-4 text-sm"
                style={{ backgroundColor: "var(--color-elevated)", color: textSub }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  color,
  textColor,
  disabled,
  onClick,
}: {
  label: string;
  color: string;
  textColor: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
      style={{ backgroundColor: color, color: textColor }}
    >
      {label}
    </button>
  );
}
