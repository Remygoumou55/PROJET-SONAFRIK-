"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  SubscribePremiumInput,
  TopupWalletInput,
} from "@sonafrik/api/wallet";
import type { WalletContext, ListenerPremiumPlan } from "@sonafrik/types";
import { ldseCache } from "@/features/shared/ldse/cache";
import { useLdseEvent } from "@/features/shared/ldse/LdseProvider";
import { WALLET_LDSE_EVENTS, WALLET_LDSE_KEYS } from "@/features/shared/ldse/wallet/wallet-ldse-config";
import { publishWalletLdseEvent } from "@/features/shared/ldse/wallet/publishWalletLdseEvent";
import { useWalletService } from "../lib/walletServiceContext";

type WalletPageBundle = { context: WalletContext; plans: ListenerPremiumPlan[] };

/** Portefeuille + plans — SSOT LDSE (cache partagé, refresh après mutation). */
export function useWalletPageData() {
  const service = useWalletService();
  const cacheKey = WALLET_LDSE_KEYS.pageData;
  const [context, setContext] = useState<WalletContext | null>(null);
  const [plans, setPlans] = useState<ListenerPremiumPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback((bundle: WalletPageBundle) => {
    ldseCache.set(cacheKey, bundle, 30_000);
    setContext(bundle.context);
    setPlans(bundle.plans);
  }, [cacheKey]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPlansError(null);
    try {
      const cached = ldseCache.get<WalletPageBundle>(cacheKey);
      if (cached) commit(cached);
      const data = await service.getWalletPageData();
      commit({ context: data.context, plans: data.plans });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setContext(null);
      setPlans([]);
      setPlansError("Impossible de charger les plans");
    } finally {
      setIsLoading(false);
    }
  }, [service, cacheKey, commit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useLdseEvent(WALLET_LDSE_EVENTS.invalidate, () => {
    void reload();
  });

  const subscribePremium = useCallback(
    async (input: SubscribePremiumInput) => {
      const result = await service.subscribePremium(input);
      publishWalletLdseEvent(WALLET_LDSE_EVENTS.subscriptionChanged);
      await reload();
      return result;
    },
    [service, reload],
  );

  const topupWallet = useCallback(
    async (input: TopupWalletInput) => {
      const result = await service.topupWallet(input);
      publishWalletLdseEvent(WALLET_LDSE_EVENTS.topupCompleted);
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
