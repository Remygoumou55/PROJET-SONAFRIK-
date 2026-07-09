"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AddPayoutAccountInput,
  RequestWithdrawalInput,
  SubscribePremiumInput,
  TopupWalletInput,
} from "@sonafrik/api/wallet";
import type {
  PayoutAccount,
  RoyaltyCalculation,
  Transaction,
  WalletContext,
  Withdrawal,
} from "@sonafrik/types";
import { ldseCache } from "@/features/shared/ldse/cache";
import { WALLET_LDSE_EVENTS, WALLET_LDSE_KEYS } from "@/features/shared/ldse/wallet/wallet-ldse-config";
import { publishWalletLdseEvent } from "@/features/shared/ldse/wallet/publishWalletLdseEvent";
import { useWalletService } from "../lib/walletServiceContext";
import { useWalletUserId } from "./useWalletUserId";
import { useWalletSrtspLiveQuery } from "./useWalletSrtspLiveQuery";
import {
  EMPTY_WALLET_TRANSACTIONS,
  EMPTY_WALLET_WITHDRAWALS,
} from "../lib/walletQueryDefaults";

type PayoutPageBundle = { accounts: PayoutAccount[]; withdrawals: Withdrawal[] };

export function useWallet() {
  const service = useWalletService();
  const { userId, ready: authReady } = useWalletUserId();

  const fetchContext = useCallback(async (): Promise<WalletContext> => {
    return service.getWalletContext();
  }, [service]);

  const {
    data: context,
    loading: isLoading,
    error: liveError,
    refresh,
  } = useWalletSrtspLiveQuery<WalletContext>({
    userId,
    queryKey: userId ? `wallet-context:${userId}` : "wallet-context:pending",
    fetcher: fetchContext,
    enabled: authReady && Boolean(userId),
  });

  const subscribePremium = useCallback(
    async (input: SubscribePremiumInput) => {
      try {
        const result = await service.subscribePremium(input);
        publishWalletLdseEvent(WALLET_LDSE_EVENTS.subscriptionChanged);
        refresh();
        return result;
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Échec de l'abonnement.");
      }
    },
    [service, refresh],
  );

  const topupWallet = useCallback(
    async (input: TopupWalletInput) => {
      try {
        const result = await service.topupWallet(input);
        publishWalletLdseEvent(WALLET_LDSE_EVENTS.topupCompleted);
        refresh();
        return result;
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Échec de la recharge.");
      }
    },
    [service, refresh],
  );

  return {
    context: context ?? null,
    isLoading: !authReady || isLoading,
    error: liveError?.message ?? null,
    subscribePremium,
    topupWallet,
    reload: refresh,
  };
}

export function useTransactions() {
  const service = useWalletService();
  const { userId, ready: authReady } = useWalletUserId();

  const fetchTransactions = useCallback(async (): Promise<Transaction[]> => {
    return service.getTransactions(20);
  }, [service]);

  const {
    data: transactions,
    loading: isLoading,
    error: liveError,
  } = useWalletSrtspLiveQuery<Transaction[]>({
    userId,
    queryKey: userId ? `wallet-transactions:${userId}` : "wallet-transactions:pending",
    fetcher: fetchTransactions,
    initialData: EMPTY_WALLET_TRANSACTIONS,
    enabled: authReady && Boolean(userId),
  });

  return {
    transactions: transactions ?? [],
    isLoading: !authReady || isLoading,
    error: liveError ? "Impossible de charger les transactions." : null,
  };
}

export function useWithdrawals() {
  const service = useWalletService();
  const { userId, ready: authReady } = useWalletUserId();

  const fetchWithdrawals = useCallback(async (): Promise<Withdrawal[]> => {
    return service.getWithdrawals();
  }, [service]);

  const {
    data: withdrawals,
    loading: isLoading,
    error: liveError,
  } = useWalletSrtspLiveQuery<Withdrawal[]>({
    userId,
    queryKey: userId ? `wallet-withdrawals:${userId}` : "wallet-withdrawals:pending",
    fetcher: fetchWithdrawals,
    initialData: EMPTY_WALLET_WITHDRAWALS,
    enabled: authReady && Boolean(userId),
  });

  return {
    withdrawals: withdrawals ?? [],
    isLoading: !authReady || isLoading,
    error: liveError ? "Impossible de charger les retraits." : null,
  };
}

export function usePayoutAccounts() {
  const service = useWalletService();
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await service.getPayoutAccounts();
      setAccounts(data);
    } catch {
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addAccount = useCallback(
    async (input: AddPayoutAccountInput) => {
      try {
        await service.addPayoutAccount(input);
        await reload();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Impossible d'ajouter le compte.");
      }
    },
    [service, reload],
  );

  const removeAccount = useCallback(
    async (id: string) => {
      try {
        await service.removePayoutAccount(id);
        await reload();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Impossible de supprimer le compte.");
      }
    },
    [service, reload],
  );

  return { accounts, isLoading, addAccount, removeAccount, reload };
}

export function useRequestWithdrawal() {
  const service = useWalletService();

  return useCallback(async (input: RequestWithdrawalInput) => {
    const result = await service.requestWithdrawal(input);
    publishWalletLdseEvent(WALLET_LDSE_EVENTS.withdrawalRequested);
    return result;
  }, [service]);
}

/** Comptes de retrait + historique — consommateur SRTSP (Phase 3.6). */
export function usePayoutPageData() {
  const service = useWalletService();
  const { userId, ready: authReady } = useWalletUserId();
  const cacheKey = WALLET_LDSE_KEYS.payoutPage;

  const fetchPayoutData = useCallback(async (): Promise<PayoutPageBundle> => {
    const cached = ldseCache.get<PayoutPageBundle>(cacheKey);
    if (cached) return cached;
    const [accounts, withdrawals] = await Promise.all([
      service.getPayoutAccounts().catch(() => [] as PayoutAccount[]),
      service.getWithdrawals().catch(() => [] as Withdrawal[]),
    ]);
    const bundle = { accounts, withdrawals };
    ldseCache.set(cacheKey, bundle, 30_000);
    return bundle;
  }, [service, cacheKey]);

  const {
    data,
    loading: isLoading,
    refresh,
  } = useWalletSrtspLiveQuery<PayoutPageBundle>({
    userId,
    queryKey: userId ? `wallet-payout:${userId}` : "wallet-payout:pending",
    fetcher: fetchPayoutData,
    enabled: authReady && Boolean(userId),
  });

  const addAccount = useCallback(
    async (input: AddPayoutAccountInput) => {
      try {
        await service.addPayoutAccount(input);
        publishWalletLdseEvent(WALLET_LDSE_EVENTS.invalidate);
        refresh();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Impossible d'ajouter le compte.");
      }
    },
    [service, refresh],
  );

  const removeAccount = useCallback(
    async (id: string) => {
      try {
        await service.removePayoutAccount(id);
        publishWalletLdseEvent(WALLET_LDSE_EVENTS.invalidate);
        refresh();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Impossible de supprimer le compte.");
      }
    },
    [service, refresh],
  );

  return {
    accounts: data?.accounts ?? [],
    withdrawals: data?.withdrawals ?? [],
    isLoading: !authReady || isLoading,
    addAccount,
    removeAccount,
  };
}

/** Royalties artiste — fetch simple via session layout (évite dev-mock-id en DB). */
export function useRoyalties() {
  const service = useWalletService();
  const { userId, ready: authReady } = useWalletUserId();
  const [royalties, setRoyalties] = useState<RoyaltyCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const rows = await service.getRoyaltyCalculations(userId);
      setRoyalties(rows);
    } catch {
      setRoyalties([]);
      setError("Impossible de charger les royalties.");
    } finally {
      setIsLoading(false);
    }
  }, [service, userId]);

  useEffect(() => {
    if (!authReady || !userId) return;
    void load();
  }, [authReady, userId, load]);

  return {
    royalties,
    isLoading: !authReady || isLoading,
    error,
    reload: load,
  };
}
