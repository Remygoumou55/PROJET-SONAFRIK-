"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/formatters";
import { adminReviewCatalogAction } from "../actions/admin-moderation.actions";
import { AdminModerationActions } from "./AdminModerationActions";
import { AdminReasonModal } from "./AdminReasonModal";
import type { PendingCatalogItem } from "@sonafrik/api/admin";

interface Props {
  initialItems: PendingCatalogItem[];
  loadError?: string | null;
}

const RELEASE_TYPE_LABELS: Record<string, string> = {
  album: "Album",
  single: "Single",
  ep: "EP",
  compilation: "Compilation",
};

export function AdminCatalogCenter({ initialItems, loadError = null }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<PendingCatalogItem[]>(initialItems);
  const [actionState, setActionState] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(loadError);

  const [rejectTarget, setRejectTarget] = useState<{
    id: string;
    type: PendingCatalogItem["type"];
    reason: string;
  } | null>(null);

  const runAction = useCallback(
    async (
      id: string,
      entityType: PendingCatalogItem["type"],
      action: "published" | "rejected",
      reason?: string,
    ) => {
      setActionState((prev) => ({ ...prev, [id]: true }));
      setError(null);
      try {
        const result = await adminReviewCatalogAction({
          id,
          entityType,
          action,
          reason,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        setItems((prev) => prev.filter((item) => item.id !== id));
        startTransition(() => router.refresh());
      } catch {
        setError("Erreur lors de l'action.");
      } finally {
        setActionState((prev) => ({ ...prev, [id]: false }));
      }
    },
    [router],
  );

  const confirmReject = () => {
    if (!rejectTarget) return;
    const { id, type, reason } = rejectTarget;
    setRejectTarget(null);
    void runAction(id, type, "rejected", reason);
  };

  return (
    <div className="admin-catalog-center space-y-4">
      <p className="admin-page-sub">
        {items.length} élément{items.length !== 1 ? "s" : ""} en attente d&apos;approbation
      </p>

      {error ? (
        <p className="admin-inline-alert admin-inline-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="admin-empty-state">
          <p className="admin-empty-state__icon" aria-hidden="true">
            ✅
          </p>
          <p className="admin-empty-state__text">Aucune soumission en attente.</p>
        </div>
      ) : (
        <div className="admin-catalog-list space-y-3">
          {items.map((item) => {
            const busy = actionState[item.id] ?? false;
            return (
              <article key={item.id} className="admin-catalog-item">
                <div className="admin-catalog-item__body">
                  <div className="admin-catalog-item__meta">
                    <span
                      className={`admin-status-badge ${item.type === "album" ? "badge-gold" : "badge-info"}`}
                    >
                      {item.type === "album"
                        ? (RELEASE_TYPE_LABELS[item.release_type ?? "album"] ?? "Album")
                        : "Morceau"}
                    </span>
                    <p className="admin-catalog-item__title">{item.title}</p>
                  </div>
                  {item.creator_name ? (
                    <p className="admin-catalog-item__artist">Artiste : {item.creator_name}</p>
                  ) : null}
                  {item.submitted_at ? (
                    <p className="admin-catalog-item__date">
                      Soumis le {formatDateTime(item.submitted_at)}
                    </p>
                  ) : null}
                </div>

                <AdminModerationActions
                  busy={busy || isPending}
                  onApprove={() => void runAction(item.id, item.type, "published")}
                  onReject={() =>
                    setRejectTarget({ id: item.id, type: item.type, reason: "" })
                  }
                />
              </article>
            );
          })}
        </div>
      )}

      {rejectTarget ? (
        <AdminReasonModal
          title="Motif de rejet"
          placeholder="Ex: Qualité audio insuffisante, métadonnées manquantes…"
          confirmLabel="Confirmer le rejet"
          value={rejectTarget.reason}
          onChange={(reason) => setRejectTarget({ ...rejectTarget, reason })}
          onConfirm={confirmReject}
          onCancel={() => setRejectTarget(null)}
          danger
        />
      ) : null}
    </div>
  );
}
