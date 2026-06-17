"use client";

import { useState, useTransition } from "react";
import { sendTipAction } from "../actions/tips.actions";

const AMOUNTS = [5000, 10000, 20000] as const;
type TipAmount = (typeof AMOUNTS)[number];

interface Props {
  receiverCreatorId: string;
  recipientName:     string;
}

export function TipButton({ receiverCreatorId, recipientName }: Props) {
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
      const result = await sendTipAction(receiverCreatorId, amount);
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
        style={{ backgroundColor: "#1A2A1A", color: "#00D26A", border: "1px solid #00D26A" }}
      >
        💸 Soutenir
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={(e) => { if (e.target === e.currentTarget) reset(); }}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl p-6 sm:rounded-2xl"
            style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }}
          >
            {success ? (
              <div className="py-4 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="font-semibold" style={{ color: "#00D26A" }}>
                  ✓ {recipientName} a reçu votre soutien !
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 rounded-full px-6 py-2 text-sm"
                  style={{ backgroundColor: "#2A2A2A", color: "#FFFFFF" }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <h3 className="mb-4 font-semibold" style={{ color: "#FFFFFF" }}>
                  Soutenir {recipientName}
                </h3>

                <div className="mb-4 flex flex-wrap gap-2">
                  {AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: amount === a ? "#00D26A" : "#2A2A2A",
                        color:           amount === a ? "#0D0D0D" : "#FFFFFF",
                      }}
                    >
                      {a.toLocaleString("fr-FR")} GNF
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="mb-3 text-sm" style={{ color: "#FF6B6B" }}>{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 rounded-full py-2 text-sm"
                    style={{ backgroundColor: "#2A2A2A", color: "#FFFFFF" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={isPending || !amount}
                    onClick={submit}
                    className="flex-1 rounded-full py-2 text-sm font-semibold disabled:opacity-50"
                    style={{
                      backgroundColor: amount ? "#00D26A" : "#1A3A1A",
                      color:           amount ? "#0D0D0D" : "#555555",
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
