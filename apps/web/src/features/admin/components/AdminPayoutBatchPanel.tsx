"use client";

import { useCallback, useState } from "react";
import type { PayoutBatch } from "@sonafrik/types";
import { formatGnf } from "@sonafrik/shared";
import { formatDateTime } from "@/lib/formatters";
import {
  adminCreatePayoutBatchAction,
  adminListPayoutBatchesAction,
} from "../actions/admin-financial.actions";
import { useAdminActionRunner } from "../hooks/useAdminActionRunner";

interface Props {
  initialBatches: PayoutBatch[];
}

export function AdminPayoutBatchPanel({ initialBatches }: Props) {
  const { error, setError, isPending, run } = useAdminActionRunner();
  const [batches, setBatches] = useState(initialBatches);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    await run(
      () => adminListPayoutBatchesAction(20),
      {
        refresh: false,
        onSuccess: (result) => {
          if (result.batches) setBatches(result.batches);
        },
      },
    );
  }, [run]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nom du lot requis.");
      return;
    }
    setBusy(true);
    setError(null);
    await run(
      () => adminCreatePayoutBatchAction({ name: trimmed, notes: notes.trim() || undefined }),
      {
        onSuccess: () => {
          setName("");
          setNotes("");
          void refresh();
        },
      },
    );
    setBusy(false);
  };

  return (
    <section
      className="rounded-xl p-5 space-y-4"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-bordure)" }}
    >
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-texte-principal)" }}>
          Lots de retrait
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-texte-secondaire)" }}>
          Regroupez les retraits approuvés avant traitement opérateur.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du lot (ex. Juin 2026 — Wave)"
          className="wallet-mono-field min-w-0 flex-1 rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: "var(--color-elevated)",
            border: "1px solid var(--color-bordure)",
            color: "var(--color-texte-principal)",
          }}
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optionnel)"
          className="wallet-mono-field min-w-0 flex-1 rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: "var(--color-elevated)",
            border: "1px solid var(--color-bordure)",
            color: "var(--color-texte-principal)",
          }}
        />
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={busy || isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
        >
          {busy || isPending ? "…" : "Créer un lot"}
        </button>
      </div>

      {error && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-erreur)" }}>
          {error}
        </p>
      )}

      {batches.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
          Aucun lot créé. Créez un lot avant d&apos;assigner des retraits en traitement.
        </p>
      ) : (
        <ul className="m-0 list-none p-0 space-y-2">
          {batches.map((batch) => (
            <li
              key={batch.id}
              className="rounded-lg px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2"
              style={{ backgroundColor: "var(--color-elevated)", border: "1px solid var(--color-bordure)" }}
            >
              <div>
                <p className="font-medium" style={{ color: "var(--color-texte-principal)" }}>{batch.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-texte-secondaire)" }}>
                  {batch.withdrawal_count} retrait{batch.withdrawal_count > 1 ? "s" : ""} · {formatGnf(batch.total_amount_gnf)} · {batch.status}
                </p>
              </div>
              <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>
                {formatDateTime(batch.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
