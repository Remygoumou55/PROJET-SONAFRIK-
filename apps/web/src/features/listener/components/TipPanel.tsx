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
  const [info, setInfo]                 = useState<string | null>(null);

  function showToast(message: string, kind: "success" | "error" | "info") {
    if (kind === "success") setConfirmation(message);
    if (kind === "error") setError(message);
    if (kind === "info") setInfo(message);
    window.setTimeout(() => {
      if (kind === "success") setConfirmation(null);
      if (kind === "error") setError(null);
      if (kind === "info") setInfo(null);
    }, 3000);
  }

  async function handleTip(amountGnf: TipAmount) {
    setLoading(true);
    setError(null);
    setConfirmation(null);
    setInfo(null);
    try {
      const result = await tip.sendTip({ receiverCreatorId: creatorId, amountGnf });
      showToast(`✓ ${result.receiverName} a reçu votre soutien !`, "success");
    } catch (err) {
      if (err instanceof TipsError && err.code === "insufficient_balance") {
        showToast("Solde insuffisant. Rechargez votre wallet.", "error");
      } else {
        showToast("Impossible d'envoyer le pourboire. Réessayez.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  if (variant === "full") {
    return (
      <div className="tip-panel">
        <div className="tip-toast-stack" aria-live="polite">
          {confirmation ? (
            <div className="tip-toast tip-toast--success">
              <span aria-hidden="true">✓</span>
              <span>{confirmation.replace("✓ ", "")}</span>
            </div>
          ) : null}
          {error ? (
            <div className="tip-toast tip-toast--error">
              <span aria-hidden="true">!</span>
              <span>{error}</span>
            </div>
          ) : null}
          {info ? (
            <div className="tip-toast tip-toast--info">
              <span aria-hidden="true">i</span>
              <span>{info}</span>
            </div>
          ) : null}
        </div>

        <div className="tip-header">
          <span className="tip-icon" aria-hidden="true">
            💛
          </span>
          <div>
            <p className="tip-title">Soutenir {artistName}</p>
            <p className="tip-subtitle">Votre contribution aide directement l&apos;artiste à continuer de créer.</p>
          </div>
        </div>

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

        <div className="tip-actions">
          <button
            type="button"
            className="tip-secondary-btn"
            onClick={() => showToast("Le montant personnalisé arrive bientôt dans cette expérience.", "info")}
          >
            Autre montant
          </button>
          <p className="tip-wallet-note">
            Le paiement est effectué directement depuis votre Wallet SONAFRIK.
          </p>
          {error?.includes("Solde insuffisant") ? (
            <Link href="/wallet" className="tip-wallet-link">
              Recharger mon wallet →
            </Link>
          ) : null}
        </div>
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
