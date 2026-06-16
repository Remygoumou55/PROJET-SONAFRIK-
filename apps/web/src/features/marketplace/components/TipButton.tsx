"use client";

import { useState, useTransition } from "react";
import { sendTipAction } from "../actions/tips.actions";

const PRESETS = [100, 500, 1000, 5000, 10000];

interface Props {
  recipientId:   string;
  recipientName: string;
}

export function TipButton({ recipientId, recipientName }: Props) {
  const [open, setOpen]         = useState(false);
  const [amount, setAmount]     = useState<number | null>(null);
  const [custom, setCustom]     = useState("");
  const [message, setMessage]   = useState("");
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAmount = amount ?? (custom ? parseInt(custom, 10) : null);

  function reset() {
    setOpen(false);
    setAmount(null);
    setCustom("");
    setMessage("");
    setSuccess(false);
    setError(null);
  }

  function submit() {
    if (!selectedAmount || selectedAmount < 100) {
      setError("Montant minimum : 100 GNF.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await sendTipAction(
        recipientId,
        selectedAmount,
        message || undefined,
      );
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
        style={{
          backgroundColor: "#1A2A1A",
          color: "#00CC44",
          border: "1px solid #00CC44",
        }}
      >
        💸 Pourboire
      </button>

      {open ? (
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
                <p className="font-semibold" style={{ color: "#00CC44" }}>
                  Pourboire envoyé !
                </p>
                <p className="mt-1 text-sm" style={{ color: "#777777" }}>
                  {recipientName} a reçu {selectedAmount ? Math.floor(selectedAmount * 0.95) : 0} GNF.
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
                  Envoyer un pourboire à {recipientName}
                </h3>

                {/* Presets */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setAmount(p); setCustom(""); }}
                      className="rounded-full px-3 py-1.5 text-sm font-medium"
                      style={{
                        backgroundColor: amount === p ? "#00CC44" : "#2A2A2A",
                        color:           amount === p ? "#000000" : "#FFFFFF",
                        border:          "1px solid transparent",
                      }}
                    >
                      {p.toLocaleString("fr-FR")} GNF
                    </button>
                  ))}
                </div>

                {/* Montant libre */}
                <input
                  type="number"
                  min={100}
                  placeholder="Autre montant (GNF)"
                  value={custom}
                  onChange={(e) => { setCustom(e.target.value); setAmount(null); }}
                  className="mb-3 w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "#0D0D0D",
                    color: "#FFFFFF",
                    border: "1px solid #333333",
                    outline: "none",
                  }}
                />

                {/* Message */}
                <textarea
                  rows={2}
                  maxLength={280}
                  placeholder="Message (optionnel)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mb-3 w-full resize-none rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "#0D0D0D",
                    color: "#FFFFFF",
                    border: "1px solid #333333",
                    outline: "none",
                  }}
                />

                {error ? (
                  <p className="mb-3 text-sm" style={{ color: "#FF6B6B" }}>
                    {error}
                  </p>
                ) : null}

                <p className="mb-4 text-xs" style={{ color: "#555555" }}>
                  5% de frais de plateforme — l&apos;artiste reçoit 95%.
                </p>

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
                    disabled={isPending || !selectedAmount}
                    onClick={submit}
                    className="flex-1 rounded-full py-2 text-sm font-semibold"
                    style={{
                      backgroundColor: selectedAmount ? "#00CC44" : "#1A3A1A",
                      color: selectedAmount ? "#000000" : "#555555",
                      cursor: isPending || !selectedAmount ? "not-allowed" : "pointer",
                    }}
                  >
                    {isPending ? "Envoi…" : "Envoyer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
