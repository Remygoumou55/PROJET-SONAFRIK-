"use client";

import { useState } from "react";
import { WalletDashboard } from "@/features/wallet/components/WalletDashboard";
import { SubscriptionModal } from "@/features/wallet/components/SubscriptionModal";
import { useWallet } from "@/features/wallet/hooks/useWallet";

export default function WalletPage() {
  const { context, isLoading, error } = useWallet();
  const [showSubscription, setShowSubscription] = useState(false);

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
        onTopup={() => {}}
      />
      {showSubscription && <SubscriptionModal onClose={() => setShowSubscription(false)} />}
    </>
  );
}
