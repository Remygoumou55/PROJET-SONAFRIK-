"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Beat } from "@sonafrik/types";
import { BEAT_LICENSE_LABELS } from "@sonafrik/types";
import { purchaseBeatAction } from "./beats.actions";
import { BEAT_HIGHLIGHT_STYLE, OVERLAY } from "@/lib/design/overlayTokens";

interface Props {
  beats: Beat[];
  purchasedIds: string[];
  highlightBeatId?: string | null;
}

function BeatCard({
  beat,
  purchased,
  highlighted,
}: {
  beat: Beat;
  purchased: boolean;
  highlighted?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(purchased);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

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
      ref={cardRef}
      id={`beat-${beat.id}`}
      className="flex flex-col rounded-xl p-4"
      style={{
        backgroundColor: "var(--color-surface)",
        border: highlighted
          ? "2px solid var(--color-or-solaire)"
          : "1px solid var(--color-elevated)",
        boxShadow: highlighted ? BEAT_HIGHLIGHT_STYLE.boxShadow : undefined,
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold" style={{ color: "var(--color-texte-principal)" }}>
            {beat.title}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-texte-desactive)" }}>
            {BEAT_LICENSE_LABELS[beat.license_type]}
          </p>
        </div>
        {done ? (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: OVERLAY.vertRow, color: "var(--color-vert-energie)", border: "1px solid var(--color-vert-energie)" }}
          >
            Acheté ✓
          </span>
        ) : (
          <span
            className="shrink-0 text-sm font-bold"
            style={{ color: isFree ? "var(--color-vert-energie)" : "var(--color-or-solaire)" }}
          >
            {isFree ? "Gratuit" : `${beat.price_gnf.toLocaleString("fr-FR")} GNF`}
          </span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {beat.bpm ? (
          <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)" }}>
            {beat.bpm} BPM
          </span>
        ) : null}
        {beat.key ? (
          <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)" }}>
            {beat.key}
          </span>
        ) : null}
        {beat.genre ? (
          <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)" }}>
            {beat.genre}
          </span>
        ) : null}
      </div>

      {beat.description ? (
        <p className="mb-3 text-xs leading-relaxed" style={{ color: "var(--color-texte-secondaire)" }}>
          {beat.description}
        </p>
      ) : null}

      {error ? (
        <p className="mb-2 text-xs" style={{ color: "var(--color-erreur)" }}>
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={done || isPending}
        onClick={buy}
        className="mt-auto w-full rounded-lg py-2 text-sm font-semibold transition-colors"
        style={{
          backgroundColor: done ? "var(--color-surface)" : "var(--color-or-solaire)",
          color: done ? "var(--color-texte-desactive)" : "var(--color-noir-profond)",
          cursor: done || isPending ? "not-allowed" : "pointer",
          border: done ? "1px solid var(--color-bordure)" : "none",
        }}
      >
        {isPending ? "Achat…" : done ? "Déjà acquis" : isFree ? "Télécharger" : "Acheter"}
      </button>
    </div>
  );
}

export function BeatStoreClient({ beats, purchasedIds, highlightBeatId }: Props) {
  const purchasedSet = new Set(purchasedIds);

  if (beats.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-3xl mb-3">🎹</p>
        <p className="font-semibold" style={{ color: "var(--color-texte-principal)" }}>
          Aucun beat disponible pour le moment.
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-texte-desactive)" }}>
          Les producteurs commencent à ajouter leurs beats.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {beats.map((beat) => (
        <BeatCard
          key={beat.id}
          beat={beat}
          purchased={purchasedSet.has(beat.id)}
          highlighted={highlightBeatId === beat.id}
        />
      ))}
    </div>
  );
}
