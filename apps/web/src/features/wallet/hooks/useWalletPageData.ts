"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  SubscribePremiumInput,
  TopupWalletInput,
} from "@sonafrik/api/wallet";
import type { WalletContext, ListenerPremiumPlan } from "@sonafrik/types";
import { useWalletService } from "../lib/walletServiceContext";

/** Charge portefeuille + plans abonnement en une seule phase (War Plan C5). */
export function useWalletPageData() {
  const service = useWalletService();
  const [context, setContext] = useState<WalletContext | null>(null);
  const [plans, setPlans] = useState<ListenerPremiumPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPlansError(null);
    try {
      const data = await service.getWalletPageData();
      setContext(data.context);
      setPlans(data.plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setContext(null);
      setPlans([]);
      setPlansError("Impossible de charger les plans");
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const subscribePremium = useCallback(
    async (input: SubscribePremiumInput) => {
      const result = await service.subscribePremium(input);
      await reload();
      return result;
    },
    [service, reload],
  );

  const topupWallet = useCallback(
    async (input: TopupWalletInput) => {
      const result = await service.topupWallet(input);
      await reload();
      return result;
    },
    [service, reload],
  );

  return {
    context,
    plans,
    isLoading,
    error,
    plansError,
    subscribePremium,
    topupWallet,
    reload,
  };
}
