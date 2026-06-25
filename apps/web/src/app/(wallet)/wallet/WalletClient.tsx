"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { WalletDashboard } from "@/features/wallet/components/WalletDashboard";
import { PaymentHistory } from "@/features/wallet/components/PaymentHistory";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { isTopupEnabled } from "@/features/wallet/lib/paymentsEnabled";

const SubscriptionModal = dynamic(
  () =>
    import("@/features/wallet/components/SubscriptionModal").then(
      (m) => ({ default: m.SubscriptionModal }),
    ),
  { ssr: false },
);

const TopupModal = dynamic(
  () =>
    import("@/features/wallet/components/TopupModal").then(
      (m) => ({ default: m.TopupModal }),
    ),
  { ssr: false },
);

export function WalletClient() {
  const { context, isLoading, error, reload } = useWallet();
  const [showSubscription, setShowSubscription] = useState(false);
  const [showTopup, setShowTopup]               = useState(false);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: "var(--color-texte-secondaire)" }}>Impossible de charger le portefeuille.</p>
      </div>
    );
  }

  return (
    <>
      <WalletDashboard
        context={context}
        topupEnabled={isTopupEnabled()}
        withdrawalEnabled={isTopupEnabled()}
        onSubscribe={() => setShowSubscription(true)}
        onTopup={() => setShowTopup(true)}
      />

      <div className="mt-8 px-4 max-w-xl mx-auto">
        <PaymentHistory />
      </div>

      {showSubscription && <SubscriptionModal onClose={() => setShowSubscription(false)} />}
      {showTopup && isTopupEnabled() && (
        <TopupModal
          onClose={() => setShowTopup(false)}
          onSuccess={() => { reload(); }}
        />
      )}
    </>
  );
}
