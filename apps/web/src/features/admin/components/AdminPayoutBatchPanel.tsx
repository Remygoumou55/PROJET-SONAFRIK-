"use client";

import { useCallback, useState } from "react";
import type { PayoutBatch } from "@sonafrik/types";
import { usePayoutService } from "../hooks/usePayoutService";
import { formatGnf } from "@sonafrik/shared";
import { formatDateTime } from "@/lib/formatters";

interface Props {
  initialBatches: PayoutBatch[];
}

export function AdminPayoutBatchPanel({ initialBatches }: Props) {
  const service = usePayoutService();
  const [batches, setBatches] = useState(initialBatches);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await service.listPayoutBatches(20);
      setBatches(data);
    } catch {
      setError("Impossible de charger les lots de retrait.");
    }
  }, [service]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nom du lot requis.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await service.createPayoutBatch({ name: trimmed, notes: notes.trim() || undefined });
      setName("");
      setNotes("");
      await refresh();
    } catch {
      setError("Création du lot impossible.");
    } finally {
      setBusy(false);
    }
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
          className="min-w-[220px] flex-1 rounded-lg px-3 py-2 text-sm"
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
          className="min-w-[180px] flex-1 rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: "var(--color-elevated)",
            border: "1px solid var(--color-bordure)",
            color: "var(--color-texte-principal)",
          }}
        />
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={busy}
          className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
        >
          {busy ? "…" : "Créer un lot"}
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
