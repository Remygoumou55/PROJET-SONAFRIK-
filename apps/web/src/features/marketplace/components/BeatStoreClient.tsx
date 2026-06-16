"use client";

import { useState, useTransition } from "react";
import type { Beat } from "@sonafrik/types";
import { BEAT_LICENSE_LABELS } from "@sonafrik/types";
import { purchaseBeatAction } from "../actions/beats.actions";

interface Props {
  beats:        Beat[];
  purchasedIds: string[];
}

function BeatCard({
  beat,
  purchased,
}: {
  beat: Beat;
  purchased: boolean;
}) {
  const [done, setDone]         = useState(purchased);
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function buy() {
    setError(null);
    startTransition(async () => {
      const result = await purchaseBeatAction(beat.id);
      if (result.error) setError(result.error);
      else setDone(true);
    });
  }

  const isFree = beat.price_gnf === 0 || beat.license_type === "free";

  return (
    <div
      className="flex flex-col rounded-xl p-4"
      style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }}
    >
      {/* En-tête */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold" style={{ color: "#FFFFFF" }}>
            {beat.title}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "#555555" }}>
            {BEAT_LICENSE_LABELS[beat.license_type]}
          </p>
        </div>
        {done ? (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: "#0A3A1A", color: "#00CC44", border: "1px solid #00CC44" }}
          >
            Acheté ✓
          </span>
        ) : (
          <span
            className="shrink-0 text-sm font-bold"
            style={{ color: isFree ? "#00CC44" : "#FFC20E" }}
          >
            {isFree ? "Gratuit" : `${beat.price_gnf.toLocaleString("fr-FR")} GNF`}
          </span>
        )}
      </div>

      {/* Méta */}
      <div className="mb-3 flex flex-wrap gap-2">
        {beat.bpm ? (
          <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: "#2A2A2A", color: "#AAAAAA" }}>
            {beat.bpm} BPM
          </span>
        ) : null}
        {beat.key ? (
          <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: "#2A2A2A", color: "#AAAAAA" }}>
            {beat.key}
          </span>
        ) : null}
        {beat.genre ? (
          <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: "#2A2A2A", color: "#AAAAAA" }}>
            {beat.genre}
          </span>
        ) : null}
      </div>

      {beat.description ? (
        <p className="mb-3 text-xs leading-relaxed" style={{ color: "#777777" }}>
          {beat.description}
        </p>
      ) : null}

      {error ? (
        <p className="mb-2 text-xs" style={{ color: "#FF6B6B" }}>
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={done || isPending}
        onClick={buy}
        className="mt-auto w-full rounded-lg py-2 text-sm font-semibold transition-colors"
        style={{
          backgroundColor: done ? "#1A1A1A" : "#FFC20E",
          color:            done ? "#555555" : "#000000",
          cursor:           done || isPending ? "not-allowed" : "pointer",
          border:           done ? "1px solid #333333" : "none",
        }}
      >
        {isPending ? "Achat…" : done ? "Déjà acquis" : isFree ? "Télécharger" : "Acheter"}
      </button>
    </div>
  );
}

export function BeatStoreClient({ beats, purchasedIds }: Props) {
  const purchasedSet = new Set(purchasedIds);

  if (beats.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-3xl mb-3">🎹</p>
        <p className="font-semibold" style={{ color: "#FFFFFF" }}>
          Aucun beat disponible pour le moment.
        </p>
        <p className="mt-1 text-sm" style={{ color: "#555555" }}>
          Les producteurs commencent à ajouter leurs beats.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {beats.map((beat) => (
        <BeatCard key={beat.id} beat={beat} purchased={purchasedSet.has(beat.id)} />
      ))}
    </div>
  );
}
