"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createWalletService } from "@sonafrik/api/wallet";
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
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useWallet() {
  const service = useMemo(() => createWalletService(getSupabaseBrowserClient()), []);
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
  const service = useMemo(() => createWalletService(getSupabaseBrowserClient()), []);
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
  const service = useMemo(() => createWalletService(getSupabaseBrowserClient()), []);
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
  const service = useMemo(() => createWalletService(getSupabaseBrowserClient()), []);
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
  const service = useMemo(() => createWalletService(getSupabaseBrowserClient()), []);

  return useCallback(async (input: RequestWithdrawalInput) => {
    return service.requestWithdrawal(input);
  }, [service]);
}

export function useRoyalties() {
  const service = useMemo(() => createWalletService(getSupabaseBrowserClient()), []);
  const [royalties, setRoyalties] = useState<RoyaltyCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    service.getRoyaltyCalculations()
      .then(setRoyalties)
      .catch(() => setError("Impossible de charger les royalties."))
      .finally(() => setIsLoading(false));
  }, [service]);

  return { royalties, isLoading, error };
}
