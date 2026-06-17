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
  if (status === "confirmed") return "#00D26A";
  if (status === "failed" || status === "expired") return "#FF6666";
  return "#F5A623"; // initiated / pending
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
      style={{ borderColor: "#2A2A2A" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{PAYMENT_PROVIDER_ICONS[intent.provider]}</span>
        <div>
          <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>
            {PAYMENT_PROVIDER_LABELS[intent.provider]}
          </p>
          <p className="text-xs" style={{ color: "#555555" }}>
            {fmtDate(intent.created_at)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
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
  const { intents, isLoading } = usePaymentHistory(10);

  if (isLoading) {
    return (
      <div className="py-6 flex justify-center">
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: "#00D26A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (intents.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold" style={{ color: "#A0A0A0" }}>
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
