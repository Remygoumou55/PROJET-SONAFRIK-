"use client";

import Link from "next/link";
import { memo } from "react";
import type { WalletContext, Transaction, ListenerPremiumPlan } from "@sonafrik/types";
import { TRANSACTION_TYPE_LABELS } from "@sonafrik/types";
import { formatGnf } from "@sonafrik/shared";
import { computeAnnualSavingsPercent } from "@sonafrik/api/wallet";
import { formatDate } from "@/lib/formatters";

const TransactionRow = memo(function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === "royalty_payout" || tx.type === "topup" || tx.type === "refund";
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "var(--color-bordure)" }}>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: isCredit ? "var(--overlay-vert-soft)" : "var(--overlay-erreur-soft)", color: isCredit ? "var(--color-vert-energie)" : "var(--color-erreur)" }}
        >
          {isCredit ? "+" : "−"}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-texte-principal)" }}>
            {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
          </p>
          <p className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>{formatDate(tx.created_at)}</p>
        </div>
      </div>
      <span
        className="text-sm font-semibold tabular-nums"
        style={{ color: isCredit ? "var(--color-vert-energie)" : "var(--color-texte-principal)" }}
      >
        {isCredit ? "+" : "−"}{formatGnf(tx.amount_gnf)}
      </span>
    </div>
  );
});

interface WalletDashboardProps {
  context: WalletContext;
  topupEnabled: boolean;
  withdrawalEnabled: boolean;
  plans: ListenerPremiumPlan[];
  plansLoading: boolean;
  onSubscribe: () => void;
  onTopup: () => void;
}

export const WalletDashboard = memo(function WalletDashboard({
  context,
  topupEnabled,
  withdrawalEnabled,
  plans,
  plansLoading,
  onSubscribe,
  onTopup,
}: WalletDashboardProps) {
  const { wallet, isPremium, premiumExpiresAt, isInGracePeriod, recentTransactions, pendingWithdrawals } = context;
  const annualSavings = computeAnnualSavingsPercent(plans);

  return (
    <div className="space-y-6">
      {/* Carte solde */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "linear-gradient(135deg, var(--color-vert-profond) 0%, var(--color-vert-energie) 100%)" }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: "rgba(255, 255, 255, 0.60)" }}>Solde disponible</p>
        <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-texte-principal)" }}>
          {formatGnf(wallet.balance_gnf)}
        </p>
        <div className="wallet-balance-actions">
          <button
            type="button"
            onClick={topupEnabled ? onTopup : undefined}
            disabled={!topupEnabled}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.13)", color: "var(--color-texte-principal)" }}
            title={topupEnabled ? undefined : "Orange Money GN — intégration en cours"}
          >
            {topupEnabled ? "Recharger" : "Recharger bientôt"}
          </button>
          {withdrawalEnabled ? (
            <Link
              href="/wallet/payout"
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-center transition-all"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.13)", color: "var(--color-texte-principal)" }}
            >
              Retirer
            </Link>
          ) : (
            <Link
              href="/wallet/payout"
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-center transition-all opacity-80"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.13)", color: "var(--color-texte-principal)" }}
            >
              Configurer retrait
            </Link>
          )}
        </div>
        {!topupEnabled && (
          <p className="text-xs mt-3" style={{ color: "rgba(255, 255, 255, 0.55)" }}>
            Recharge Mobile Money bientôt disponible — Orange Money GN en cours d&apos;intégration.
          </p>
        )}
      </div>

      {/* Statut premium */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-bordure)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>
              {isPremium ? "Premium actif" : isInGracePeriod ? "Essai gratuit" : "Accès expiré"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-texte-secondaire)" }}>
              {isPremium && premiumExpiresAt
                ? `Expire le ${new Date(premiumExpiresAt).toLocaleDateString("fr-FR")}`
                : isInGracePeriod
                ? "7 jours d'essai · Abonnez-vous pour continuer"
                : "Abonnez-vous pour écouter SONAFRIK"}
            </p>
          </div>
          {!isPremium && (
            <button
              onClick={onSubscribe}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "var(--color-or-solaire)", color: "var(--color-noir-profond)" }}
            >
              {isInGracePeriod ? "S'abonner" : "Renouveler"}
            </button>
          )}
          {isPremium && (
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: "rgba(0,210,106,0.13)", color: "var(--color-vert-energie)" }}
            >
              PREMIUM
            </span>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="wallet-stat-grid">
        {[
          { label: "Total rechargé", value: formatGnf(wallet.total_credited_gnf) },
          { label: "Total dépensé", value: formatGnf(wallet.total_debited_gnf) },
          { label: "Retraits en attente", value: String(pendingWithdrawals) },
        ].map(({ label, value }) => (
          <div key={label} className="wallet-stat-card">
            <p className="text-sm font-bold truncate" style={{ color: "var(--color-texte-principal)" }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-texte-secondaire)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Transactions récentes */}
      {recentTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>Dernières opérations</h3>
            <Link href="/wallet" className="text-xs" style={{ color: "var(--color-vert-energie)" }}>Voir tout</Link>
          </div>
          <div className="rounded-xl px-4" style={{ backgroundColor: "var(--color-card)" }}>
            {recentTransactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      )}

      {recentTransactions.length === 0 && (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "var(--color-card)" }}>
          <p className="text-2xl mb-2">💸</p>
          <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>Aucune transaction. Rechargez votre portefeuille.</p>
        </div>
      )}

      {/* Plans — tarifs depuis subscription_plans (DB) */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-texte-principal)" }}>Abonnements</h3>
        {plansLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl p-4 h-24 animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>Tarifs indisponibles pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={onSubscribe}
                className="rounded-xl p-4 text-left transition-all"
                style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-bordure)" }}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="font-semibold text-sm" style={{ color: "var(--color-texte-principal)" }}>{plan.label}</p>
                  {plan.billingPeriod === "annual" && annualSavings != null && annualSavings > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(255,194,14,0.13)", color: "var(--color-or-solaire)" }}>
                      −{annualSavings}%
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold mt-1" style={{ color: "var(--color-or-solaire)" }}>
                  {formatGnf(plan.priceGnf)}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-texte-secondaire)" }}>
                  {plan.durationDays} jours · Écoute illimitée
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
