"use client";

import { useState, useTransition } from "react";
import { TIP_AMOUNTS } from "@sonafrik/types";
import type { TipAmount } from "@sonafrik/types";
import { sendTipAction } from "../actions/tips.actions";
import { OVERLAY } from "@/lib/design/overlayTokens";

interface Props {
  creatorId:  string;
  artistName: string;
}

export function TipButton({ creatorId, artistName }: Props) {
  const [open, setOpen]       = useState(false);
  const [amount, setAmount]   = useState<TipAmount | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setOpen(false);
    setAmount(null);
    setSuccess(false);
    setError(null);
  }

  function submit() {
    if (!amount) { setError("Choisissez un montant."); return; }
    setError(null);
    startTransition(async () => {
      const result = await sendTipAction(creatorId, amount);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
        style={{ backgroundColor: OVERLAY.vertRow, color: "var(--color-vert-energie)", border: "1px solid var(--color-vert-energie)" }}
      >
        💸 Soutenir
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ backgroundColor: OVERLAY.noir75 }}
          onClick={(e) => { if (e.target === e.currentTarget) reset(); }}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl p-6 sm:rounded-2xl"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-elevated)" }}
          >
            {success ? (
              <div className="py-4 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="font-semibold" style={{ color: "var(--color-vert-energie)" }}>
                  ✓ {artistName} a reçu votre soutien !
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 rounded-full px-6 py-2 text-sm"
                  style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-principal)" }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <h3 className="mb-4 font-semibold" style={{ color: "var(--color-texte-principal)" }}>
                  Soutenir {artistName}
                </h3>

                <div className="mb-4 flex flex-wrap gap-2">
                  {TIP_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: amount === a ? "var(--color-vert-energie)" : "var(--color-elevated)",
                        color:           amount === a ? "var(--color-noir-profond)" : "var(--color-texte-principal)",
                      }}
                    >
                      {a.toLocaleString("fr-FR")} GNF
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="mb-3 text-sm" style={{ color: "var(--color-erreur)" }}>{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 rounded-full py-2 text-sm"
                    style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-principal)" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={isPending || !amount}
                    onClick={submit}
                    className="flex-1 rounded-full py-2 text-sm font-semibold disabled:opacity-50"
                    style={{
                      backgroundColor: amount ? "var(--color-vert-energie)" : OVERLAY.vertRow,
                      color:           amount ? "var(--color-noir-profond)" : "var(--color-texte-desactive)",
                    }}
                  >
                    {isPending ? "Envoi…" : "Envoyer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
