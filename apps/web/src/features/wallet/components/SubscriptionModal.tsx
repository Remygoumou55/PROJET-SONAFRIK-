"use client";

import { memo, useState } from "react";
import { SUBSCRIPTION_PLANS } from "@sonafrik/types";
import type { SubscriptionPlanType } from "@sonafrik/types";
import { useWallet } from "../hooks/useWallet";

interface SubscriptionModalProps {
  onClose: () => void;
}

export const SubscriptionModal = memo(function SubscriptionModal({ onClose }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>("MONTHLY");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { subscribePremium } = useWallet();

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await subscribePremium({ planType: SUBSCRIPTION_PLANS[selectedPlan].type });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la souscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(13,13,13,0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: "var(--color-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--color-texte-principal)" }}>Choisir un abonnement</h2>
          <button onClick={onClose} style={{ color: "var(--color-texte-secondaire)" }} className="text-xl leading-none">×</button>
        </div>

        {success ? (
          <div className="py-6 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-semibold" style={{ color: "var(--color-vert-energie)" }}>Abonnement activé !</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanType[]).map((key) => {
                const plan = SUBSCRIPTION_PLANS[key];
                const isSelected = selectedPlan === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className="w-full rounded-xl p-4 text-left transition-all"
                    style={{
                      backgroundColor: isSelected ? "rgba(0,210,106,0.13)" : "var(--color-elevated)",
                      border: `2px solid ${isSelected ? "var(--color-vert-energie)" : "var(--color-bordure)"}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: "var(--color-texte-principal)" }}>{plan.label}</span>
                      {key === "ANNUAL" && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,194,14,0.13)", color: "var(--color-or-solaire)" }}>
                          −20%
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-bold mt-1" style={{ color: isSelected ? "var(--color-vert-energie)" : "var(--color-texte-principal)" }}>
                      {new Intl.NumberFormat("fr-GN").format(plan.price_gnf)} GNF
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-texte-secondaire)" }}>
                      {plan.duration_days} jours · Écoute illimitée
                    </p>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: "var(--color-erreur)" }}>{error}</p>
            )}

            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
            >
              {isLoading ? "Traitement…" : `S'abonner — ${new Intl.NumberFormat("fr-GN").format(SUBSCRIPTION_PLANS[selectedPlan].price_gnf)} GNF`}
            </button>

            <p className="text-xs text-center" style={{ color: "var(--color-texte-desactive)" }}>
              Débité de votre portefeuille SONAFRIK
            </p>
          </>
        )}
      </div>
    </div>
  );
});
