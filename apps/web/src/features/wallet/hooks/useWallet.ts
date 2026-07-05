"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  SubscribePremiumInput,
  AddPayoutAccountInput,
  RequestWithdrawalInput,
  TopupWalletInput,
} from "@sonafrik/api/wallet";
import type {
  WalletContext,
  Transaction,
  Withdrawal,
  PayoutAccount,
  RoyaltyCalculation,
} from "@sonafrik/types";
import { ldseCache } from "@/features/shared/ldse/cache";
import { useLdseEvent } from "@/features/shared/ldse/LdseProvider";
import { WALLET_LDSE_EVENTS, WALLET_LDSE_KEYS } from "@/features/shared/ldse/wallet/wallet-ldse-config";
import { publishWalletLdseEvent } from "@/features/shared/ldse/wallet/publishWalletLdseEvent";
import { useWalletService } from "../lib/walletServiceContext";

export function useWallet() {
  const service = useWalletService();
  const [context, setContext] = useState<WalletContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ctx = await service.getWalletContext();
      setContext(ctx);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const subscribePremium = useCallback(async (input: SubscribePremiumInput) => {
    try {
      const result = await service.subscribePremium(input);
      await loadContext();
      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Échec de l'abonnement.");
    }
  }, [service, loadContext]);

  const topupWallet = useCallback(async (input: TopupWalletInput) => {
    try {
      const result = await service.topupWallet(input);
      await loadContext();
      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Échec de la recharge.");
    }
  }, [service, loadContext]);

  return { context, isLoading, error, subscribePremium, topupWallet, reload: loadContext };
}

export function useTransactions() {
  const service = useWalletService();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    service.getTransactions(20)
      .then(setTransactions)
      .catch(() => setError("Impossible de charger les transactions."))
      .finally(() => setIsLoading(false));
  }, [service]);

  return { transactions, isLoading, error };
}

export function useWithdrawals() {
  const service = useWalletService();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    service.getWithdrawals()
      .then(setWithdrawals)
      .catch(() => setError("Impossible de charger les retraits."))
      .finally(() => setIsLoading(false));
  }, [service]);

  return { withdrawals, isLoading, error };
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

  useEffect(() => { reload(); }, [reload]);

  const addAccount = useCallback(async (input: AddPayoutAccountInput) => {
    try {
      await service.addPayoutAccount(input);
      await reload();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Impossible d'ajouter le compte.");
    }
  }, [service, reload]);

  const removeAccount = useCallback(async (id: string) => {
    try {
      await service.removePayoutAccount(id);
      await reload();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Impossible de supprimer le compte.");
    }
  }, [service, reload]);

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

/** Charge comptes de retrait + historique en parallèle — SSOT LDSE payout page. */
export function usePayoutPageData() {
  const service = useWalletService();
  const cacheKey = WALLET_LDSE_KEYS.payoutPage;
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const cached = ldseCache.get<{ accounts: PayoutAccount[]; withdrawals: Withdrawal[] }>(cacheKey);
      if (cached) {
        setAccounts(cached.accounts);
        setWithdrawals(cached.withdrawals);
      }
      const [accs, wds] = await Promise.all([
        service.getPayoutAccounts().catch(() => [] as PayoutAccount[]),
        service.getWithdrawals().catch(() => [] as Withdrawal[]),
      ]);
      ldseCache.set(cacheKey, { accounts: accs, withdrawals: wds }, 30_000);
      setAccounts(accs);
      setWithdrawals(wds);
    } finally {
      setIsLoading(false);
    }
  }, [service, cacheKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useLdseEvent(WALLET_LDSE_EVENTS.invalidate, () => {
    void reload();
  });

  const reloadAccounts = useCallback(async () => {
    const [accs, wds] = await Promise.all([
      service.getPayoutAccounts().catch(() => [] as PayoutAccount[]),
      service.getWithdrawals().catch(() => [] as Withdrawal[]),
    ]);
    setAccounts(accs);
    setWithdrawals(wds);
    ldseCache.set(cacheKey, { accounts: accs, withdrawals: wds }, 30_000);
  }, [service, cacheKey]);

  const addAccount = useCallback(async (input: AddPayoutAccountInput) => {
    try {
      await service.addPayoutAccount(input);
      publishWalletLdseEvent(WALLET_LDSE_EVENTS.invalidate);
      await reloadAccounts();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Impossible d'ajouter le compte.");
    }
  }, [service, reloadAccounts]);

  const removeAccount = useCallback(async (id: string) => {
    try {
      await service.removePayoutAccount(id);
      publishWalletLdseEvent(WALLET_LDSE_EVENTS.invalidate);
      await reloadAccounts();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Impossible de supprimer le compte.");
    }
  }, [service, reloadAccounts]);

  return { accounts, withdrawals, isLoading, addAccount, removeAccount };
}

export function useRoyalties() {
  const service = useWalletService();
  const cacheKey = WALLET_LDSE_KEYS.royalties;
  const [royalties, setRoyalties] = useState<RoyaltyCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cached = ldseCache.get<RoyaltyCalculation[]>(cacheKey);
      if (cached) setRoyalties(cached);
      const data = await service.getRoyaltyCalculations();
      ldseCache.set(cacheKey, data, 60_000);
      setRoyalties(data);
    } catch {
      setError("Impossible de charger les royalties.");
    } finally {
      setIsLoading(false);
    }
  }, [service, cacheKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useLdseEvent(WALLET_LDSE_EVENTS.invalidate, () => {
    void reload();
  });

  return { royalties, isLoading, error, reload };
}
