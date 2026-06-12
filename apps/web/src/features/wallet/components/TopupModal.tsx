"use client";

import { memo, useState } from "react";
import type { TopupWalletInput } from "@sonafrik/api/wallet";
import { useWallet } from "../hooks/useWallet";

const PAYMENT_METHODS: { value: TopupWalletInput["paymentMethod"]; label: string; icon: string }[] = [
  { value: "orange_money", label: "Orange Money", icon: "🟠" },
  { value: "mtn_momo", label: "MTN Mobile Money", icon: "🟡" },
  { value: "wave", label: "Wave", icon: "🔵" },
  { value: "card", label: "Carte bancaire", icon: "💳" },
];

const AMOUNTS = [5000, 10000, 25000, 50000, 100000, 250000];

interface TopupModalProps {
  onClose: () => void;
}

export const TopupModal = memo(function TopupModal({ onClose }: TopupModalProps) {
  const { topupWallet } = useWallet();

  const [paymentMethod, setPaymentMethod] = useState<TopupWalletInput["paymentMethod"]>("orange_money");
  const [amountGnf, setAmountGnf] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const effectiveAmount = customAmount ? Number(customAmount) : amountGnf;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveAmount < 1000) {
      setError("Montant minimum : 1 000 GNF");
      return;
    }
    if (!paymentReference.trim()) {
      setError("Référence de paiement requise");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await topupWallet({
        amountGnf: effectiveAmount,
        paymentMethod,
        paymentReference: paymentReference.trim(),
      });
      setNewBalance(result.newBalanceGnf);
      setSuccess(true);
      setTimeout(onClose, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la recharge. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

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
            Recharger le portefeuille
          </h2>
          <button onClick={onClose} style={{ color: "#A0A0A0" }} className="text-xl leading-none">
            ×
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-4xl">✅</p>
            <p className="font-semibold text-base" style={{ color: "#00D26A" }}>
              Recharge réussie !
            </p>
            {newBalance !== null && (
              <p className="text-sm" style={{ color: "#A0A0A0" }}>
                Nouveau solde :{" "}
                <span style={{ color: "#FFFFFF", fontWeight: 600 }}>
                  {new Intl.NumberFormat("fr-GN").format(Math.round(newBalance))} GNF
                </span>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Méthode de paiement */}
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: "#A0A0A0" }}>
                Méthode de paiement
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMethod(m.value)}
                    className="rounded-xl p-3 text-left text-sm transition-all"
                    style={{
                      backgroundColor: paymentMethod === m.value ? "#00D26A22" : "#2A2A2A",
                      border: `1.5px solid ${paymentMethod === m.value ? "#00D26A" : "#333333"}`,
                      color: "#FFFFFF",
                    }}
                  >
                    <span className="mr-1.5">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Montants rapides */}
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: "#A0A0A0" }}>
                Montant (GNF)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => { setAmountGnf(a); setCustomAmount(""); }}
                    className="rounded-xl py-2 text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: amountGnf === a && !customAmount ? "#00D26A22" : "#2A2A2A",
                      border: `1.5px solid ${amountGnf === a && !customAmount ? "#00D26A" : "#333333"}`,
                      color: amountGnf === a && !customAmount ? "#00D26A" : "#FFFFFF",
                    }}
                  >
                    {new Intl.NumberFormat("fr-GN").format(a)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1000}
                step={500}
                placeholder="Autre montant…"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Référence de paiement */}
            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: "#A0A0A0" }}>
                Référence de paiement
              </p>
              <input
                type="text"
                required
                placeholder="Ex: OM-2024-00123456"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                style={inputStyle}
              />
              <p className="text-xs" style={{ color: "#555555" }}>
                Numéro de transaction fourni par votre opérateur
              </p>
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: "#FF6666" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || effectiveAmount < 1000}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
            >
              {isLoading
                ? "Traitement…"
                : `Recharger ${new Intl.NumberFormat("fr-GN").format(effectiveAmount)} GNF`}
            </button>

            <p className="text-xs text-center" style={{ color: "#555555" }}>
              Effectuez d&apos;abord le paiement auprès de l&apos;opérateur,
              puis renseignez la référence ci-dessus.
            </p>
          </form>
        )}
      </div>
    </div>
  );
});
