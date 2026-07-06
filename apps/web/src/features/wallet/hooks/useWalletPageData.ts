"use client";

import { useCallback } from "react";
import type {
  SubscribePremiumInput,
  TopupWalletInput,
} from "@sonafrik/api/wallet";
import type { WalletContext, ListenerPremiumPlan } from "@sonafrik/types";
import { ldseCache } from "@/features/shared/ldse/cache";
import { WALLET_LDSE_EVENTS, WALLET_LDSE_KEYS } from "@/features/shared/ldse/wallet/wallet-ldse-config";
import { publishWalletLdseEvent } from "@/features/shared/ldse/wallet/publishWalletLdseEvent";
import { useWalletService } from "../lib/walletServiceContext";
import { useWalletUserId } from "./useWalletUserId";
import { useWalletSrtspLiveQuery } from "./useWalletSrtspLiveQuery";

type WalletPageBundle = { context: WalletContext; plans: ListenerPremiumPlan[] };

/** Portefeuille + plans — consommateur SRTSP officiel (Phase 3.6). */
export function useWalletPageData() {
  const service = useWalletService();
  const userId = useWalletUserId();
  const cacheKey = WALLET_LDSE_KEYS.pageData;

  const fetchPageData = useCallback(async (): Promise<WalletPageBundle> => {
    const cached = ldseCache.get<WalletPageBundle>(cacheKey);
    if (cached) return cached;
    const data = await service.getWalletPageData();
    const bundle = { context: data.context, plans: data.plans };
    ldseCache.set(cacheKey, bundle, 30_000);
    return bundle;
  }, [service, cacheKey]);

  const {
    data,
    loading: isLoading,
    error: liveError,
    refresh,
  } = useWalletSrtspLiveQuery<WalletPageBundle>({
    userId,
    queryKey: userId ? `wallet-page:${userId}` : "wallet-page:pending",
    fetcher: fetchPageData,
    enabled: Boolean(userId),
  });

  const context = data?.context ?? null;
  const plans = data?.plans ?? [];
  const error = liveError?.message ?? null;
  const plansError = error ? "Impossible de charger les plans" : null;

  const subscribePremium = useCallback(
    async (input: SubscribePremiumInput) => {
      const result = await service.subscribePremium(input);
      publishWalletLdseEvent(WALLET_LDSE_EVENTS.subscriptionChanged);
      refresh();
      return result;
    },
    [service, refresh],
  );

  const topupWallet = useCallback(
    async (input: TopupWalletInput) => {
      const result = await service.topupWallet(input);
      publishWalletLdseEvent(WALLET_LDSE_EVENTS.topupCompleted);
      refresh();
      return result;
    },
    [service, refresh],
  );

  return {
    context,
    plans,
    isLoading: isLoading || !userId,
    error,
    plansError,
    subscribePremium,
    topupWallet,
    reload: refresh,
  };
}
