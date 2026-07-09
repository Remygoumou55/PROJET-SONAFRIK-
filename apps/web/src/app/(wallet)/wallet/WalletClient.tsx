"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { WalletDashboard } from "@/features/wallet/components/WalletDashboard";
import { useWalletPageData } from "@/features/wallet/hooks/useWalletPageData";
import { isTopupEnabled, isWithdrawalEnabled } from "@/features/wallet/lib/paymentsEnabled";

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
  const {
    context,
    plans,
    isLoading,
    error,
    plansError,
    reload,
  } = useWalletPageData();
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
        withdrawalEnabled={isWithdrawalEnabled()}
        plans={plans}
        plansLoading={false}
        onSubscribe={() => setShowSubscription(true)}
        onTopup={() => setShowTopup(true)}
      />

      {showSubscription && (
        <SubscriptionModal
          plans={plans}
          isLoading={isLoading}
          loadError={plansError}
          onClose={() => setShowSubscription(false)}
        />
      )}
      {showTopup && isTopupEnabled() && (
        <TopupModal
          onClose={() => setShowTopup(false)}
          onSuccess={() => { reload(); }}
        />
      )}
    </>
  );
}
