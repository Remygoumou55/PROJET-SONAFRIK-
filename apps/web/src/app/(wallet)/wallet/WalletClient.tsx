"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { WalletDashboard } from "@/features/wallet/components/WalletDashboard";
import { useWallet } from "@/features/wallet/hooks/useWallet";

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
  const { context, isLoading, error } = useWallet();
  const [showSubscription, setShowSubscription] = useState(false);
  const [showTopup, setShowTopup] = useState(false);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#00D26A", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: "#A0A0A0" }}>Impossible de charger le portefeuille.</p>
      </div>
    );
  }

  return (
    <>
      <WalletDashboard
        context={context}
        onSubscribe={() => setShowSubscription(true)}
        onTopup={() => setShowTopup(true)}
      />
      {showSubscription && <SubscriptionModal onClose={() => setShowSubscription(false)} />}
      {showTopup && <TopupModal onClose={() => setShowTopup(false)} />}
    </>
  );
}
