"use client";

import { useCallback, useMemo, useState } from "react";
import { useAdminService } from "../hooks/useAdminService";
import { formatDateTime } from "@/lib/formatters";
import {
  RIGHTS_CLAIM_TYPE_LABELS,
  RIGHTS_CLAIM_STATUS_LABELS,
  type RightsClaimType,
  type RightsClaimStatus,
} from "@sonafrik/types";

export interface ClaimWithContext {
  id: string;
  work_id: string;
  work_title: string;
  claimant_id: string;
  claimant_name: string | null;
  claim_type: RightsClaimType;
  status: RightsClaimStatus;
  description: string;
  evidence_url: string | null;
  created_at: string;
}

interface Props {
  initialClaims: ClaimWithContext[];
}

type StatusFilter = RightsClaimStatus | "all";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "En attente",    value: "pending" },
  { label: "Escaladées",   value: "escalated" },
  { label: "Acceptées",    value: "accepted" },
  { label: "Rejetées",     value: "rejected" },
  { label: "Tout",         value: "all" },
];

const STATUS_COLORS: Record<RightsClaimStatus, { bg: string; text: string }> = {
  pending:   { bg: "rgba(255,194,14,0.13)",  text: "var(--color-or-solaire)" },
  accepted:  { bg: "rgba(0,210,106,0.13)",   text: "var(--color-vert-energie)" },
  rejected:  { bg: "rgba(255,68,68,0.13)",   text: "var(--color-erreur)" },
  escalated: { bg: "rgba(168,85,247,0.13)",  text: "#C084FC" },
};

const TYPE_COLORS: Record<RightsClaimType, string> = {
  ownership:     "#3B82F6",
  infringement:  "var(--color-erreur)",
  takedown:      "var(--color-or-solaire)",
};

export function AdminRightsCenter({ initialClaims }: Props) {
  const admin = useAdminService();
  const [claims, setClaims] = useState<ClaimWithContext[]>(initialClaims);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [actionState, setActionState] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ claimId: string; reason: string } | null>(null);

  const cardBg   = "var(--color-card)";
  const border   = "var(--color-elevated)";
  const textMain = "var(--color-texte-principal)";
  const textSub  = "var(--color-texte-secondaire)";

  const filtered = useMemo(
    () => statusFilter === "all" ? claims : claims.filter((c) => c.status === statusFilter),
    [claims, statusFilter],
  );

  const runUpdate = useCallback(
    async (claimId: string, status: RightsClaimStatus, notes?: string) => {
      setActionState((prev) => ({ ...prev, [claimId]: true }));
      setError(null);
      try {
        await admin.updateRightsClaim(claimId, status, notes);
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, status } : c)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      } finally {
        setActionState((prev) => ({ ...prev, [claimId]: false }));
      }
    },
    [admin],
  );

  const handleAccept = (id: string) => void runUpdate(id, "accepted");
  const handleEscalate = (id: string) => void runUpdate(id, "escalated");
  const handleReject = (id: string) => setModal({ claimId: id, reason: "" });

  const confirmReject = () => {
    if (!modal) return;
    const { claimId, reason } = modal;
    setModal(null);
    void runUpdate(claimId, "rejected", reason || undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: textMain }}>
          Droits & Revendications
        </h1>
        <p className="mt-1 text-sm" style={{ color: textSub }}>
          Revendications de droits soumises par les créateurs
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
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

      {error && (
        <p className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-erreur)" }}>
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: cardBg }}>
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm" style={{ color: textSub }}>
            Aucune revendication dans cette catégorie.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((claim) => {
            const busy = actionState[claim.id] ?? false;
            const sc   = STATUS_COLORS[claim.status];
            const tc   = TYPE_COLORS[claim.claim_type];
            return (
              <div
                key={claim.id}
                className="rounded-xl p-5"
                style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${tc}22`, color: tc }}
                      >
                        {RIGHTS_CLAIM_TYPE_LABELS[claim.claim_type] ?? claim.claim_type}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: sc.bg, color: sc.text }}
                      >
                        {RIGHTS_CLAIM_STATUS_LABELS[claim.status] ?? claim.status}
                      </span>
                    </div>

                    {/* Œuvre */}
                    <p className="text-sm font-semibold" style={{ color: textMain }}>
                      {claim.work_title}
                    </p>

                    {/* Claimer */}
                    <p className="text-xs mt-0.5" style={{ color: textSub }}>
                      Soumis par : {claim.claimant_name ?? claim.claimant_id.slice(0, 8) + "…"}
                    </p>

                    {/* Date */}
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-texte-desactive)" }}>
                      {formatDateTime(claim.created_at)}
                    </p>

                    {/* Description */}
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--color-texte-secondaire)" }}>
                      {claim.description}
                    </p>

                    {/* Preuve */}
                    {claim.evidence_url && (
                      <a
                        href={claim.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs mt-1 inline-block hover:underline"
                        style={{ color: "var(--color-vert-energie)" }}
                      >
                        Voir la preuve →
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  {(claim.status === "pending" || claim.status === "escalated") && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        disabled={busy}
                        onClick={() => handleAccept(claim.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition-opacity"
                        style={{ backgroundColor: "rgba(0,210,106,0.13)", color: "var(--color-vert-energie)" }}
                      >
                        {busy ? "…" : "Accepter"}
                      </button>
                      {claim.status === "pending" && (
                        <button
                          disabled={busy}
                          onClick={() => handleEscalate(claim.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition-opacity"
                          style={{ backgroundColor: "rgba(168,85,247,0.13)", color: "#C084FC" }}
                        >
                          Escalader
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={() => handleReject(claim.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition-opacity"
                        style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-erreur)" }}
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal rejet */}
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
              Motif de rejet (optionnel)
            </h3>
            <textarea
              autoFocus
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--color-elevated)", border: `1px solid ${border}`, color: textMain }}
              placeholder="Ex: Absence de preuves suffisantes, revendication hors délai…"
              value={modal.reason}
              onChange={(e) => setModal({ ...modal, reason: e.target.value })}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmReject}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-erreur)" }}
              >
                Confirmer le rejet
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
