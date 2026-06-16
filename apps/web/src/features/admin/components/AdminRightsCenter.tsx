"use client";

import { useCallback, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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
  pending:   { bg: "#FFC20E22", text: "#FFC20E" },
  accepted:  { bg: "#00D26A22", text: "#00D26A" },
  rejected:  { bg: "#FF444422", text: "#FF6666" },
  escalated: { bg: "#A855F722", text: "#C084FC" },
};

const TYPE_COLORS: Record<RightsClaimType, string> = {
  ownership:     "#3B82F6",
  infringement:  "#FF6666",
  takedown:      "#FFC20E",
};

export function AdminRightsCenter({ initialClaims }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [claims, setClaims] = useState<ClaimWithContext[]>(initialClaims);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [actionState, setActionState] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ claimId: string; reason: string } | null>(null);

  const cardBg   = "#1F1F1F";
  const border   = "#2A2A2A";
  const textMain = "#FFFFFF";
  const textSub  = "#A0A0A0";

  const filtered = useMemo(
    () => statusFilter === "all" ? claims : claims.filter((c) => c.status === statusFilter),
    [claims, statusFilter],
  );

  const runUpdate = useCallback(
    async (claimId: string, status: RightsClaimStatus, notes?: string) => {
      setActionState((prev) => ({ ...prev, [claimId]: true }));
      setError(null);
      try {
        const patch: Record<string, string> = {
          status,
          reviewed_at: new Date().toISOString(),
        };
        if (notes) patch.resolution_notes = notes;

        const { error: dbError } = await (supabase as ReturnType<typeof getSupabaseBrowserClient>)
          .from("rights_claims" as never)
          .update(patch as never)
          .eq("id", claimId);

        if (dbError) throw new Error(dbError.message);

        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, status } : c)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      } finally {
        setActionState((prev) => ({ ...prev, [claimId]: false }));
      }
    },
    [supabase],
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
              backgroundColor: statusFilter === f.value ? "#00D26A" : cardBg,
              color: statusFilter === f.value ? "#0D0D0D" : textSub,
              border: `1px solid ${statusFilter === f.value ? "#00D26A" : border}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#FF444422", color: "#FF6666" }}>
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
                    <p className="text-xs mt-0.5" style={{ color: "#555555" }}>
                      {formatDateTime(claim.created_at)}
                    </p>

                    {/* Description */}
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: "#A0A0A0" }}>
                      {claim.description}
                    </p>

                    {/* Preuve */}
                    {claim.evidence_url && (
                      <a
                        href={claim.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs mt-1 inline-block hover:underline"
                        style={{ color: "#00D26A" }}
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
                        style={{ backgroundColor: "#00D26A22", color: "#00D26A" }}
                      >
                        {busy ? "…" : "Accepter"}
                      </button>
                      {claim.status === "pending" && (
                        <button
                          disabled={busy}
                          onClick={() => handleEscalate(claim.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition-opacity"
                          style={{ backgroundColor: "#A855F722", color: "#C084FC" }}
                        >
                          Escalader
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={() => handleReject(claim.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition-opacity"
                        style={{ backgroundColor: "#FF444422", color: "#FF6666" }}
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
            style={{ backgroundColor: "#1F1F1F", border: `1px solid ${border}` }}
          >
            <h3 className="text-base font-semibold" style={{ color: textMain }}>
              Motif de rejet (optionnel)
            </h3>
            <textarea
              autoFocus
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ backgroundColor: "#2A2A2A", border: `1px solid ${border}`, color: textMain }}
              placeholder="Ex: Absence de preuves suffisantes, revendication hors délai…"
              value={modal.reason}
              onChange={(e) => setModal({ ...modal, reason: e.target.value })}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmReject}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={{ backgroundColor: "#FF444422", color: "#FF6666" }}
              >
                Confirmer le rejet
              </button>
              <button
                onClick={() => setModal(null)}
                className="rounded-xl px-4 text-sm"
                style={{ backgroundColor: "#2A2A2A", color: textSub }}
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
