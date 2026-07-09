"use client";

import { memo } from "react";
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_PROVIDER_ICONS,
  PAYMENT_INTENT_STATUS_LABELS,
  type PaymentIntent,
  type PaymentIntentStatus,
} from "@sonafrik/types";
import { usePaymentHistory } from "../hooks/usePaymentHistory";

function statusColor(status: PaymentIntentStatus): string {
  if (status === "confirmed") return "var(--color-vert-energie)";
  if (status === "failed" || status === "expired") return "var(--color-erreur)";
  return "var(--color-pending)";
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-GN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function PaymentIntentRow({ intent }: { intent: PaymentIntent }) {
  return (
    <div className="wallet-recharge-row">
      <div className="wallet-recharge-row__main">
        <span className="wallet-recharge-row__icon" aria-hidden="true">
          {PAYMENT_PROVIDER_ICONS[intent.provider]}
        </span>
        <div className="wallet-recharge-row__copy">
          <p className="wallet-recharge-row__provider">
            {PAYMENT_PROVIDER_LABELS[intent.provider]}
          </p>
          <p className="wallet-recharge-row__date">{fmtDate(intent.created_at)}</p>
        </div>
      </div>
      <div className="wallet-recharge-row__meta">
        <p className="wallet-recharge-row__amount">
          {new Intl.NumberFormat("fr-GN").format(intent.amount_gnf)} GNF
        </p>
        <p className="wallet-recharge-row__status" style={{ color: statusColor(intent.status) }}>
          {PAYMENT_INTENT_STATUS_LABELS[intent.status]}
        </p>
      </div>
    </div>
  );
}

export const RechargeHistoryPage = memo(function RechargeHistoryPage() {
  const { intents, isLoading, error, reload } = usePaymentHistory(50);

  if (isLoading) {
    return (
      <div className="wallet-recharge-page">
        <header className="wallet-recharge-page__head">
          <h1 className="wallet-shell__title">Historique des recharges</h1>
          <p className="wallet-recharge-page__sub">
            Toutes vos tentatives de recharge Mobile Money.
          </p>
        </header>
        <div className="wallet-recharge-page__list" aria-busy="true">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="wallet-recharge-row wallet-recharge-row--skeleton animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-recharge-page">
        <header className="wallet-recharge-page__head">
          <h1 className="wallet-shell__title">Historique des recharges</h1>
        </header>
        <div className="wallet-recharge-page__empty" role="alert">
          <p>{error}</p>
          <button type="button" className="wallet-recharge-page__retry" onClick={() => void reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-recharge-page">
      <header className="wallet-recharge-page__head">
        <h1 className="wallet-shell__title">Historique des recharges</h1>
        <p className="wallet-recharge-page__sub">
          {intents.length > 0
            ? `${intents.length} opération${intents.length > 1 ? "s" : ""} récente${intents.length > 1 ? "s" : ""}`
            : "Aucune recharge enregistrée pour le moment."}
        </p>
      </header>

      {intents.length === 0 ? (
        <div className="wallet-recharge-page__empty">
          <p className="wallet-recharge-page__empty-icon" aria-hidden="true">
            💸
          </p>
          <p>Vos recharges Orange Money, MTN MoMo et Wave apparaîtront ici.</p>
        </div>
      ) : (
        <div className="wallet-recharge-page__list">
          {intents.map((intent) => (
            <PaymentIntentRow key={intent.id} intent={intent} />
          ))}
        </div>
      )}
    </div>
  );
});
