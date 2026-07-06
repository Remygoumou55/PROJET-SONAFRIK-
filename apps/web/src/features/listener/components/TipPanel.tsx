"use client";

import Link from "next/link";
import { memo, useState } from "react";
import { TIP_AMOUNTS } from "@sonafrik/types";
import type { TipAmount } from "@sonafrik/types";
import { useTipService } from "../hooks/useTipService";
import { OVERLAY } from "@/lib/design/overlayTokens";
import { TipsError } from "@sonafrik/api/tips";

interface Props {
  creatorId: string;
  artistName: string;
  variant?: "compact" | "full";
}

export const TipPanel = memo(function TipPanel({ creatorId, artistName, variant = "compact" }: Props) {
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

  if (variant === "full") {
    return (
      <div className="tip-panel">
        <div className="tip-header">
          <span className="tip-icon" aria-hidden="true">
            💛
          </span>
          <div>
            <p className="tip-title">Soutenir {artistName}</p>
            <p className="tip-subtitle">Envoyez directement un pourboire à l&apos;artiste</p>
          </div>
        </div>

        {confirmation ? (
          <div className="tip-success">
            <span className="tip-success-icon" aria-hidden="true">
              🎉
            </span>
            <p className="tip-success-title">Merci pour votre soutien !</p>
            <p className="tip-success-sub">{confirmation.replace("✓ ", "")}</p>
          </div>
        ) : (
          <>
            <div className="tip-amounts">
              {TIP_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`tip-amount-btn${loading ? " loading" : ""}`}
                  disabled={loading}
                  onClick={() => void handleTip(amount)}
                  aria-label={`Envoyer ${amount.toLocaleString("fr-FR")} GNF à ${artistName}`}
                >
                  {loading ? (
                    <span className="tip-loading-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : (
                    <>
                      <span className="tip-amount-value">{amount.toLocaleString("fr-FR")}</span>
                      <span className="tip-amount-currency">GNF</span>
                    </>
                  )}
                </button>
              ))}
            </div>

            {error ? (
              <div
                className={`tip-error${
                  error.includes("Solde insuffisant") ? " tip-error--wallet" : ""
                }`}
              >
                <span aria-hidden="true">{error.includes("Solde insuffisant") ? "💳" : "⚠️"}</span>
                <p>{error}</p>
                {error.includes("Solde insuffisant") ? (
                  <Link href="/wallet" className="tip-wallet-link">
                    Recharger mon wallet →
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="mb-2 rounded-xl px-3.5 py-2.5"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-elevated)" }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-texte-secondaire)" }}>
        Soutenir {artistName}
      </p>

      {confirmation ? (
        <div
          className="rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ backgroundColor: OVERLAY.vertNav, color: "var(--color-vert-energie)" }}
        >
          {confirmation}
        </div>
      ) : error ? (
        <div
          className="rounded-lg px-3 py-2 text-xs"
          style={{ backgroundColor: OVERLAY.erreurSoft, color: "var(--color-erreur)" }}
        >
          {error}
          {error.includes("Solde insuffisant") ? (
            <Link href="/wallet" className="tip-wallet-link mt-2 inline-block">
              Recharger mon wallet →
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="flex gap-2">
          {TIP_AMOUNTS.map((a) => (
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
