"use client";

import { memo, useEffect, useState } from "react";
import type { ListenerPremiumPlan } from "@sonafrik/types";
import { computeAnnualSavingsPercent } from "@sonafrik/api/wallet";
import { useWallet } from "../hooks/useWallet";

interface SubscriptionModalProps {
  plans: ListenerPremiumPlan[];
  isLoading: boolean;
  loadError: string | null;
  onClose: () => void;
}

export const SubscriptionModal = memo(function SubscriptionModal({
  plans,
  isLoading: plansLoading,
  loadError: plansError,
  onClose,
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<ListenerPremiumPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { subscribePremium } = useWallet();
  const annualSavings = computeAnnualSavingsPercent(plans);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans[0] ?? null);
    }
  }, [plans, selectedPlan]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);
    setError(null);
    try {
      await subscribePremium({ planType: selectedPlan.planType });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la souscription");
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error ?? plansError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--overlay-modal-backdrop)" }}
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
        ) : plansLoading ? (
          <div className="py-10 flex justify-center">
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }}
            />
          </div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--color-texte-secondaire)" }}>
            {displayError ?? "Aucun plan disponible pour le moment."}
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className="w-full rounded-xl p-4 text-left transition-all"
                    style={{
                      backgroundColor: isSelected ? "var(--overlay-vert-soft)" : "var(--color-elevated)",
                      border: `2px solid ${isSelected ? "var(--color-vert-energie)" : "var(--color-bordure)"}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: "var(--color-texte-principal)" }}>{plan.label}</span>
                      {plan.billingPeriod === "annual" && annualSavings != null && annualSavings > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--overlay-or-soft)", color: "var(--color-or-solaire)" }}>
                          −{annualSavings}%
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-bold mt-1" style={{ color: isSelected ? "var(--color-vert-energie)" : "var(--color-texte-principal)" }}>
                      {new Intl.NumberFormat("fr-GN").format(plan.priceGnf)} GNF
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-texte-secondaire)" }}>
                      {plan.durationDays} jours · Écoute illimitée
                    </p>
                  </button>
                );
              })}
            </div>

            {displayError && (
              <p className="text-sm text-center" style={{ color: "var(--color-erreur)" }}>{displayError}</p>
            )}

            <button
              onClick={handleSubscribe}
              disabled={isLoading || !selectedPlan}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
            >
              {isLoading
                ? "Traitement…"
                : `S'abonner — ${selectedPlan ? new Intl.NumberFormat("fr-GN").format(selectedPlan.priceGnf) : "—"} GNF`}
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
