import { useCallback, useEffect, useMemo, useState } from "react";
import { createWalletService } from "@sonafrik/api/wallet";
import type { WalletContext, PayoutAccount, RoyaltyCalculation } from "@sonafrik/types";
import { getSupabaseMobileClient } from "../../lib/supabase";

export function useWallet() {
  const service = useMemo(() => createWalletService(getSupabaseMobileClient()), []);
  const [context, setContext] = useState<WalletContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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

  useEffect(() => { load(); }, [load]);

  const subscribePremium = useCallback(async (planType: "monthly" | "annual") => {
    const result = await service.subscribePremium({ planType });
    await load();
    return result;
  }, [service, load]);

  return { context, isLoading, error, subscribePremium, reload: load };
}

export function usePayoutAccounts() {
  const service = useMemo(() => createWalletService(getSupabaseMobileClient()), []);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const data = await service.getPayoutAccounts();
    setAccounts(data);
    setIsLoading(false);
  }, [service]);

  useEffect(() => { reload(); }, [reload]);

  return { accounts, isLoading, reload };
}

export function useRoyalties() {
  const service = useMemo(() => createWalletService(getSupabaseMobileClient()), []);
  const [royalties, setRoyalties] = useState<RoyaltyCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    service.getRoyaltyCalculations().then(setRoyalties).finally(() => setIsLoading(false));
  }, [service]);

  return { royalties, isLoading };
}
