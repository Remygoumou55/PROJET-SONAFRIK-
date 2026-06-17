"use client";

import { memo } from "react";
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_PROVIDER_ICONS,
  type PaymentProvider,
} from "@sonafrik/types";

interface PaymentProviderSelectorProps {
  selected: PaymentProvider;
  onSelect: (provider: PaymentProvider) => void;
}

const PROVIDERS: PaymentProvider[] = ["orange_money_gn", "mtn_momo_gn", "wave_gn", "soutra_money"];

export const PaymentProviderSelector = memo(function PaymentProviderSelector({
  selected,
  onSelect,
}: PaymentProviderSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PROVIDERS.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => onSelect(provider)}
          className="rounded-xl p-3 text-left text-sm transition-all"
          style={{
            backgroundColor: selected === provider ? "#00D26A22" : "#2A2A2A",
            border: `1.5px solid ${selected === provider ? "#00D26A" : "#333333"}`,
            color: "#FFFFFF",
          }}
        >
          <span className="mr-1.5">{PAYMENT_PROVIDER_ICONS[provider]}</span>
          {PAYMENT_PROVIDER_LABELS[provider]}
        </button>
      ))}
    </div>
  );
});
