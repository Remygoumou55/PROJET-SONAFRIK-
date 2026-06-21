"use client";

import { memo, useState } from "react";
import { useTipService } from "../hooks/useTipService";
import { TipsError } from "@sonafrik/api/tips";

const AMOUNTS = [5000, 10000, 20000] as const;
type TipAmount = (typeof AMOUNTS)[number];

interface Props {
  creatorId:  string;
  artistName: string;
}

export const TipButton = memo(function TipButton({ creatorId, artistName }: Props) {
  const tip = useTipService();
  const [loading, setLoading]           = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  async function handleTip(amountGnf: TipAmount) {
    setLoading(true);
    setError(null);
    setConfirmation(null);
    try {
      const result = await tip.sendTip({ receiverCreatorId: creatorId, amountGnf });
      setConfirmation(`✓ ${result.receiverName} a reçu votre soutien !`);
      setTimeout(() => { setConfirmation(null); }, 3000);
    } catch (err) {
      if (err instanceof TipsError && err.code === "insufficient_balance") {
        setError("Solde insuffisant. Rechargez votre wallet.");
      } else {
        setError("Impossible d'envoyer le pourboire. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="mx-4 mb-2 rounded-xl px-3.5 py-2.5"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-elevated)" }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-texte-secondaire)" }}>
        Soutenir {artistName}
      </p>

      {confirmation ? (
        <div
          className="rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ backgroundColor: "rgba(0,210,106,0.09)", color: "var(--color-vert-energie)" }}
        >
          {confirmation}
        </div>
      ) : error ? (
        <div
          className="rounded-lg px-3 py-2 text-xs"
          style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-erreur)" }}
        >
          {error}
        </div>
      ) : (
        <div className="flex gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              disabled={loading}
              onClick={() => void handleTip(a)}
              className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
            >
              {a.toLocaleString("fr-FR")} GNF
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
