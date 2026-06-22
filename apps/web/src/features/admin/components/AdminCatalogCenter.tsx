"use client";

import { useCallback, useState } from "react";
import { useAdminService } from "../hooks/useAdminService";
import { formatDateTime } from "@/lib/formatters";

type EntityType = "album" | "track";
type ReviewStatus = "published" | "rejected";

interface PendingItem {
  id: string;
  type: EntityType;
  title: string;
  creator_name: string | null;
  submitted_at: string | null;
  release_type?: string;
}

interface Props {
  initialItems: PendingItem[];
}

const RELEASE_TYPE_LABELS: Record<string, string> = {
  album: "Album",
  single: "Single",
  ep: "EP",
  compilation: "Compilation",
};

export function AdminCatalogCenter({ initialItems }: Props) {
  const admin = useAdminService();
  const [items, setItems] = useState<PendingItem[]>(initialItems);
  const [actionState, setActionState] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{
    id: string;
    type: EntityType;
    action: ReviewStatus;
    reason: string;
  } | null>(null);

  const runAction = useCallback(
    async (id: string, entityType: EntityType, action: ReviewStatus, reason?: string) => {
      setActionState((prev) => ({ ...prev, [id]: true }));
      setError(null);
      try {
        await admin.reviewCatalogItem(id, entityType, action, reason);
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'action.");
      } finally {
        setActionState((prev) => ({ ...prev, [id]: false }));
      }
    },
    [admin],
  );

  const confirmModal = () => {
    if (!modal) return;
    const { id, type, action, reason } = modal;
    setModal(null);
    void runAction(id, type, action, reason);
  };

  const cardBg = "var(--color-card)";
  const border = "var(--color-bordure)";
  const textMain = "var(--color-texte-principal)";
  const textSub = "var(--color-texte-secondaire)";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: textMain }}>
          Revue Catalogue
        </h1>
        <p className="mt-1 text-sm" style={{ color: textSub }}>
          Soumissions en attente d&apos;approbation — {items.length} élément{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {error && (
        <p className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-erreur)" }}>
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: cardBg }}>
          <p className="text-2xl">✅</p>
          <p className="mt-2 text-sm" style={{ color: textSub }}>
            Aucune soumission en attente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const busy = actionState[item.id] ?? false;
            return (
              <div
                key={item.id}
                className="rounded-xl p-5"
                style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: item.type === "album" ? "rgba(255,194,14,0.13)" : "rgba(59,130,246,0.13)",
                          color: item.type === "album" ? "var(--color-or-solaire)" : "#60A5FA",
                        }}
                      >
                        {item.type === "album"
                          ? (RELEASE_TYPE_LABELS[item.release_type ?? "album"] ?? "Album")
                          : "Morceau"}
                      </span>
                      <p className="text-sm font-semibold" style={{ color: textMain }}>
                        {item.title}
                      </p>
                    </div>
                    {item.creator_name && (
                      <p className="mt-0.5 text-xs" style={{ color: textSub }}>
                        Artiste : {item.creator_name}
                      </p>
                    )}
                    {item.submitted_at && (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--color-texte-desactive)" }}>
                        Soumis le {formatDateTime(item.submitted_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busy}
                      onClick={() => void runAction(item.id, item.type, "published")}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition-opacity"
                      style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
                    >
                      {busy ? "…" : "Approuver"}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        setModal({ id: item.id, type: item.type, action: "rejected", reason: "" })
                      }
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition-opacity"
                      style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-erreur)" }}
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal motif de rejet */}
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
              Motif de rejet
            </h3>
            <input
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: "var(--color-elevated)", border: `1px solid ${border}`, color: textMain }}
              placeholder="Ex: Qualité audio insuffisante, métadonnées manquantes…"
              value={modal.reason}
              onChange={(e) => setModal({ ...modal, reason: e.target.value })}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmModal}
                disabled={!modal.reason.trim()}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
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
