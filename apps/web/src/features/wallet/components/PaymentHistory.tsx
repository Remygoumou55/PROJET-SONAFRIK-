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
  return "var(--color-pending)"; // initiated / pending
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-GN", {
    day:    "2-digit",
    month:  "short",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function IntentRow({ intent }: { intent: PaymentIntent }) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b"
      style={{ borderColor: "var(--color-elevated)" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{PAYMENT_PROVIDER_ICONS[intent.provider]}</span>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-texte-principal)" }}>
            {PAYMENT_PROVIDER_LABELS[intent.provider]}
          </p>
          <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>
            {fmtDate(intent.created_at)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>
          {new Intl.NumberFormat("fr-GN").format(intent.amount_gnf)} GNF
        </p>
        <p className="text-xs font-medium" style={{ color: statusColor(intent.status) }}>
          {PAYMENT_INTENT_STATUS_LABELS[intent.status]}
        </p>
      </div>
    </div>
  );
}

export const PaymentHistory = memo(function PaymentHistory() {
  const { intents, isLoading, error } = usePaymentHistory(10);

  if (isLoading) {
    return (
      <div className="py-6 flex justify-center">
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm" role="alert" style={{ color: "var(--color-erreur)" }}>
        {error}
      </p>
    );
  }

  if (intents.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold" style={{ color: "var(--color-texte-secondaire)" }}>
        Historique des recharges
      </h3>
      <div>
        {intents.map((intent) => (
          <IntentRow key={intent.id} intent={intent} />
        ))}
      </div>
    </div>
  );
});
