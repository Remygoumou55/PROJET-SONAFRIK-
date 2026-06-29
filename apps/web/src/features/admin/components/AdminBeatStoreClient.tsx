"use client";

import { useCallback, useState, useTransition } from "react";
import type { AdminBeatStoreDashboard, AdminBeatStoreRow } from "@sonafrik/api/admin";
import { formatGnf } from "@sonafrik/shared";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminTable, type AdminTableColumn } from "./AdminTable";
import { AdminConfirmModal } from "./AdminConfirmModal";
import {
  adminApproveBeatAction,
  adminDeleteBeatAction,
  adminRejectBeatAction,
} from "../actions/admin-sprint5.actions";
import { useAdminActionRunner } from "../hooks/useAdminActionRunner";

type ActionTarget = {
  id: string;
  title: string;
  action: "approve" | "reject" | "delete";
};

async function resolvePreviewUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.storage.from("catalog-audio").createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

export function AdminBeatStoreClient({
  beats,
  total,
  currentFilter,
  counts,
  totalRevenue,
}: AdminBeatStoreDashboard) {
  const [selected, setSelected] = useState<ActionTarget | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const { error, isPending, run } = useAdminActionRunner();

  const executeAction = async () => {
    if (!selected) return;
    if (selected.action === "approve") {
      await run(() => adminApproveBeatAction({ beatId: selected.id }));
    } else if (selected.action === "reject") {
      await run(() => adminRejectBeatAction({ beatId: selected.id, reason: rejectReason }));
    } else {
      await run(() => adminDeleteBeatAction({ beatId: selected.id }));
    }
    setSelected(null);
    setRejectReason("");
    startTransition(() => router.refresh());
  };

  const togglePreview = useCallback(
    async (beat: AdminBeatStoreRow) => {
      if (playingId === beat.id) {
        setPlayingId(null);
        setPreviewUrl(null);
        return;
      }
      const url = await resolvePreviewUrl(beat.audioPreviewPath);
      setPlayingId(beat.id);
      setPreviewUrl(url);
    },
    [playingId],
  );

  const columns: AdminTableColumn<AdminBeatStoreRow>[] = [
    {
      key: "coverPath",
      label: "",
      width: "52px",
      hideOnMobile: true,
      render: (row) => (
        <div className="beatstore-cover">
          {row.coverPath ? (
            <span className="beatstore-cover-icon">🖼</span>
          ) : (
            <span className="beatstore-cover-icon">🎹</span>
          )}
        </div>
      ),
    },
    {
      key: "title",
      label: "Beat",
      render: (row) => (
        <div>
          <p className="beatstore-title">{row.title}</p>
          <p className="beatstore-artist">{row.stageName}</p>
        </div>
      ),
    },
    {
      key: "specs",
      label: "Specs",
      hideOnMobile: true,
      render: (row) => (
        <div className="beatstore-specs">
          <p>{row.bpm ?? "—"} BPM</p>
          <p>
            {row.keySignature ?? "—"} · {row.genre ?? "—"}
          </p>
        </div>
      ),
    },
    {
      key: "priceGnf",
      label: "Prix",
      render: (row) => <span className="beatstore-price">{formatGnf(row.priceGnf)}</span>,
    },
    {
      key: "stats",
      label: "Stats",
      hideOnMobile: true,
      render: (row) =>
        currentFilter === "published" ? (
          <div className="beatstore-stats">
            <p className="admin-text-ok">{row.purchaseCount} ventes</p>
            <p className="beatstore-stats-sub">{formatGnf(row.revenueGnf)}</p>
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "createdAt",
      label: "Soumis le",
      hideOnMobile: true,
      render: (row) => (
        <span className="beatstore-date">{new Date(row.createdAt).toLocaleDateString("fr-FR")}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "200px",
      render: (row) => (
        <div className="admin-moderation-actions">
          {row.audioPreviewPath && (
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-ghost"
              onClick={() => void togglePreview(row)}
            >
              {playingId === row.id ? "⏹" : "▶"}
            </button>
          )}
          {row.publicationStatus === "draft" && (
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-primary"
              onClick={() => setSelected({ id: row.id, title: row.title, action: "approve" })}
            >
              ✅
            </button>
          )}
          {row.publicationStatus !== "archived" && (
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-warning"
              onClick={() => setSelected({ id: row.id, title: row.title, action: "reject" })}
            >
              ❌
            </button>
          )}
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-danger"
            onClick={() => setSelected({ id: row.id, title: row.title, action: "delete" })}
          >
            🗑
          </button>
        </div>
      ),
    },
  ];

  const playingBeat = beats.find((b) => b.id === playingId);

  return (
    <div className="admin-dashboard admin-beatstore-module">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Beat Store</h1>
        <p className="admin-page-sub">Gestion des beats en vente sur SONAFRIK</p>
      </div>

      {error && <p className="admin-inline-error">{error}</p>}

      <div className="admin-kpis-grid admin-kpis-grid--4">
        <div className="admin-kpi-card">
          <p className={`admin-kpi-value${counts.pending > 0 ? " admin-kpi-value--warn" : " admin-kpi-value--ok"}`}>
            {counts.pending}
          </p>
          <p className="admin-kpi-title">En attente</p>
        </div>
        <div className="admin-kpi-card">
          <p className="admin-kpi-value">{counts.published}</p>
          <p className="admin-kpi-title">Publiés</p>
        </div>
        <div className="admin-kpi-card">
          <p className="admin-kpi-value">{counts.rejected}</p>
          <p className="admin-kpi-title">Refusés</p>
        </div>
        <div className="admin-kpi-card">
          <p className="admin-kpi-value admin-kpi-value--gold">{formatGnf(totalRevenue)}</p>
          <p className="admin-kpi-title">Revenus Beat Store</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-filters">
          {(
            [
              { key: "pending", label: `⏳ En attente (${counts.pending})` },
              { key: "published", label: `✅ Publiés (${counts.published})` },
              { key: "rejected", label: `❌ Refusés (${counts.rejected})` },
            ] as const
          ).map((f) => (
            <a
              key={f.key}
              href={`/admin/beatstore?filter=${f.key}`}
              className={`admin-filter-btn${currentFilter === f.key ? " active" : ""}`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {playingBeat && previewUrl && (
        <div className="admin-inline-player">
          <span>▶ Preview :</span>
          <span className="admin-inline-player-title">{playingBeat.title}</span>
          <audio
            src={previewUrl}
            autoPlay
            controls
            className="admin-inline-player-audio"
            onEnded={() => {
              setPlayingId(null);
              setPreviewUrl(null);
            }}
          />
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-ghost"
            onClick={() => {
              setPlayingId(null);
              setPreviewUrl(null);
            }}
          >
            ✕
          </button>
        </div>
      )}

      <AdminTable
        columns={columns}
        data={beats as (AdminBeatStoreRow & Record<string, unknown>)[]}
        keyField="id"
        emptyMessage={
          currentFilter === "pending"
            ? "✅ Aucun beat en attente."
            : "Aucun beat pour ce filtre."
        }
      />

      {total > beats.length && (
        <p className="admin-table-footer">
          {beats.length} sur {total} beats affichés
        </p>
      )}

      {selected?.action === "approve" && (
        <AdminConfirmModal
          isOpen
          title={`Approuver « ${selected.title} »`}
          description="Ce beat sera mis en vente sur le Beat Store SONAFRIK."
          confirmText="APPROUVER"
          confirmLabel="✅ Mettre en vente"
          isDanger={false}
          onConfirm={executeAction}
          onCancel={() => setSelected(null)}
        />
      )}

      {selected?.action === "reject" && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <h3 className="admin-modal-title">Refuser « {selected.title} »</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="admin-input"
              rows={3}
              placeholder="Motif du refus obligatoire..."
            />
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => { setSelected(null); setRejectReason(""); }}>
                Annuler
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={executeAction}
                disabled={!rejectReason.trim() || isPending}
              >
                ❌ Refuser
              </button>
            </div>
          </div>
        </div>
      )}

      {selected?.action === "delete" && (
        <AdminConfirmModal
          isOpen
          title={`Supprimer « ${selected.title} »`}
          description="Ce beat sera supprimé définitivement. Action IRRÉVERSIBLE."
          confirmText="CONFIRMER"
          confirmLabel="🗑 Supprimer définitivement"
          isDanger
          onConfirm={executeAction}
          onCancel={() => setSelected(null)}
        />
      )}
    </div>
  );
}
