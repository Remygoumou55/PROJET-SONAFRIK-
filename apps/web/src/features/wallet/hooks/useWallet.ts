"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createWalletService } from "@sonafrik/api/wallet";
import type {
  SubscribePremiumInput,
  AddPayoutAccountInput,
  RequestWithdrawalInput,
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
    const result = await service.subscribePremium(input);
    await loadContext();
    return result;
  }, [service, loadContext]);

  return { context, isLoading, error, subscribePremium, reload: loadContext };
}

export function useTransactions() {
  const service = useMemo(() => createWalletService(getSupabaseBrowserClient()), []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    service.getTransactions(20).then(setTransactions).finally(() => setIsLoading(false));
  }, [service]);

  return { transactions, isLoading };
}

export function useWithdrawals() {
  const service = useMemo(() => createWalletService(getSupabaseBrowserClient()), []);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    service.getWithdrawals().then(setWithdrawals).finally(() => setIsLoading(false));
  }, [service]);

  return { withdrawals, isLoading };
}

export function usePayoutAccounts() {
  const service = useMemo(() => createWalletService(getSupabaseBrowserClient()), []);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const data = await service.getPayoutAccounts();
    setAccounts(data);
    setIsLoading(false);
  }, [service]);

  useEffect(() => { reload(); }, [reload]);

  const addAccount = useCallback(async (input: AddPayoutAccountInput) => {
    await service.addPayoutAccount(input);
    await reload();
  }, [service, reload]);

  const removeAccount = useCallback(async (id: string) => {
    await service.removePayoutAccount(id);
    await reload();
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

  useEffect(() => {
    service.getRoyaltyCalculations().then(setRoyalties).finally(() => setIsLoading(false));
  }, [service]);

  return { royalties, isLoading };
}
