"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_INTENT_STATUS_LABELS,
  PAYMENT_ERROR_MESSAGES,
  type PaymentProvider,
  type PaymentIntentStatus,
} from "@sonafrik/types";
import { PaymentError } from "@sonafrik/api/payments";
import { PaymentProviderSelector } from "./PaymentProviderSelector";
import { usePaymentService } from "../hooks/usePaymentService";

const AMOUNTS = [5_000, 10_000, 25_000, 50_000, 100_000, 250_000];
const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_MS      = 5 * 60 * 1_000;

type Step = "provider-amount" | "phone" | "polling" | "done";

interface TopupModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-GN").format(n);
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #333333",
  backgroundColor: "#2A2A2A",
  color: "#FFFFFF",
  fontSize: 14,
  outline: "none",
};

export const TopupModal = memo(function TopupModal({ onClose, onSuccess }: TopupModalProps) {
  const paymentsService = usePaymentService();
  const onSuccessRef    = useRef(onSuccess);
  onSuccessRef.current  = onSuccess;

  const [step, setStep]             = useState<Step>("provider-amount");
  const [provider, setProvider]     = useState<PaymentProvider>("orange_money_gn");
  const [amountGnf, setAmountGnf]   = useState(10_000);
  const [customAmount, setCustomAmount] = useState("");
  const [phone, setPhone]           = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [intentId, setIntentId]     = useState<string | null>(null);
  const [intentStatus, setIntentStatus] = useState<PaymentIntentStatus | null>(null);
  const [pollSeconds, setPollSeconds]   = useState(0);

  const effectiveAmount = customAmount ? Number(customAmount) : amountGnf;

  // ── Étape 1 → 2 : valider montant et passer au choix du numéro ──────────
  const handleAmountNext = () => {
    if (effectiveAmount < 1_000) {
      setError("Montant minimum : 1 000 GNF");
      return;
    }
    setError(null);
    setStep("phone");
  };

  // ── Étape 2 → 3 : initier le paiement ───────────────────────────────────
  const handleInitiate = useCallback(async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 8) {
      setError("Numéro de téléphone invalide");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await paymentsService.initiatePayment({
        provider,
        purpose:   "topup",
        amountGnf: effectiveAmount,
        phone:     trimmed,
      });
      setIntentId(result.intentId);
      setInstructions(result.instructions);
      setStep("polling");
      setPollSeconds(0);
    } catch (err) {
      const msg = err instanceof PaymentError
        ? err.message
        : err instanceof Error ? err.message : (PAYMENT_ERROR_MESSAGES["unknown"] ?? "Une erreur est survenue.");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [paymentsService, provider, effectiveAmount, phone]);

  // ── Polling ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "polling" || !intentId) return;

    const startTime = Date.now();
    let seconds = 0;

    const timer = setInterval(async () => {
      seconds += POLL_INTERVAL_MS / 1_000;
      setPollSeconds(seconds);

      if (Date.now() - startTime > MAX_POLL_MS) {
        clearInterval(timer);
        setIntentStatus("expired");
        setStep("done");
        return;
      }

      try {
        const intent = await paymentsService.getIntent(intentId);
        if (!intent) return;
        const { status } = intent;
        if (status === "confirmed" || status === "failed" || status === "expired") {
          clearInterval(timer);
          setIntentStatus(status);
          setStep("done");
          if (status === "confirmed") onSuccessRef.current?.();
        }
      } catch {
        // erreur réseau transitoire, continuer le polling
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [step, intentId, paymentsService]);

  const isSuccess = intentStatus === "confirmed";
  const isExpired = intentStatus === "expired";

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "#0D0D0DCC" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: "#1F1F1F" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "#FFFFFF" }}>
            {step === "provider-amount" && "Recharger le portefeuille"}
            {step === "phone"           && "Numéro de paiement"}
            {step === "polling"         && "En attente de confirmation"}
            {step === "done"            && (isSuccess ? "Recharge réussie !" : "Paiement non confirmé")}
          </h2>
          <button onClick={onClose} style={{ color: "#A0A0A0" }} className="text-xl leading-none">
            ×
          </button>
        </div>

        {/* ── Étape 1 : Provider + montant ─────────────────────────────── */}
        {step === "provider-amount" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: "#A0A0A0" }}>Opérateur</p>
              <PaymentProviderSelector selected={provider} onSelect={setProvider} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: "#A0A0A0" }}>Montant (GNF)</p>
              <div className="grid grid-cols-3 gap-2">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => { setAmountGnf(a); setCustomAmount(""); }}
                    className="rounded-xl py-2 text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: amountGnf === a && !customAmount ? "#00D26A22" : "#2A2A2A",
                      border:          `1.5px solid ${amountGnf === a && !customAmount ? "#00D26A" : "#333333"}`,
                      color:           amountGnf === a && !customAmount ? "#00D26A" : "#FFFFFF",
                    }}
                  >
                    {fmt(a)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1_000}
                step={500}
                placeholder="Autre montant…"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                style={inputStyle}
              />
            </div>

            {error && <p className="text-sm text-center" style={{ color: "#FF6666" }}>{error}</p>}

            <button
              type="button"
              onClick={handleAmountNext}
              disabled={effectiveAmount < 1_000}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
            >
              Continuer — {fmt(effectiveAmount)} GNF via {PAYMENT_PROVIDER_LABELS[provider]}
            </button>
          </div>
        )}

        {/* ── Étape 2 : Numéro de téléphone ────────────────────────────── */}
        {step === "phone" && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "#A0A0A0" }}>
              Entrez le numéro {PAYMENT_PROVIDER_LABELS[provider]} sur lequel payer.
            </p>

            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: "#A0A0A0" }}>Numéro de téléphone</p>
              <div className="flex gap-2">
                <span
                  className="flex items-center px-3 rounded-xl text-sm"
                  style={{ backgroundColor: "#2A2A2A", color: "#A0A0A0", border: "1px solid #333333" }}
                >
                  🇬🇳 +224
                </span>
                <input
                  type="tel"
                  autoFocus
                  placeholder="620 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </div>

            {error && <p className="text-sm text-center" style={{ color: "#FF6666" }}>{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep("provider-amount"); setError(null); }}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{ backgroundColor: "#2A2A2A", color: "#A0A0A0", border: "1px solid #333333" }}
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleInitiate}
                disabled={isLoading || phone.trim().length < 8}
                className="flex-[2] py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
              >
                {isLoading ? "Initiation…" : "Payer maintenant"}
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Polling ─────────────────────────────────────────── */}
        {step === "polling" && (
          <div className="space-y-5 py-2">
            <div className="flex justify-center">
              <div
                className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{ borderColor: "#00D26A", borderTopColor: "transparent" }}
              />
            </div>

            <div
              className="rounded-xl p-4 text-sm space-y-1"
              style={{ backgroundColor: "#2A2A2A", color: "#FFFFFF" }}
            >
              <p className="font-semibold" style={{ color: "#00D26A" }}>Action requise</p>
              <p>{instructions}</p>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs" style={{ color: "#555555" }}>
                En attente depuis {Math.floor(pollSeconds / 60)}:{String(Math.round(pollSeconds % 60)).padStart(2, "0")}
              </p>
              <p className="text-xs" style={{ color: "#555555" }}>
                Délai maximum : 5 minutes
              </p>
            </div>
          </div>
        )}

        {/* ── Étape 4 : Résultat ────────────────────────────────────────── */}
        {step === "done" && (
          <div className="py-6 text-center space-y-3">
            <p className="text-4xl">{isSuccess ? "✅" : "⚠️"}</p>
            <p className="font-semibold text-base" style={{ color: isSuccess ? "#00D26A" : "#FF6666" }}>
              {isSuccess
                ? "Paiement confirmé !"
                : isExpired
                  ? PAYMENT_INTENT_STATUS_LABELS.expired
                  : intentStatus
                    ? PAYMENT_INTENT_STATUS_LABELS[intentStatus]
                    : "Non confirmé"}
            </p>
            <p className="text-sm" style={{ color: "#A0A0A0" }}>
              {isSuccess
                ? "Votre portefeuille a été rechargé. Fermez cette fenêtre pour voir votre nouveau solde."
                : "Votre portefeuille n'a pas été débité. Réessayez ou contactez l'opérateur."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-sm mt-2"
              style={{
                backgroundColor: isSuccess ? "#00D26A" : "#2A2A2A",
                color:           isSuccess ? "#0D0D0D" : "#FFFFFF",
                border:          isSuccess ? "none" : "1px solid #333333",
              }}
            >
              {isSuccess ? "Voir mon solde" : "Fermer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
