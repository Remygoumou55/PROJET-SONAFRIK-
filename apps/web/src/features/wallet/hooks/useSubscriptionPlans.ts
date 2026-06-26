"use client";

import { useCallback, useEffect, useState } from "react";
import type { ListenerPremiumPlan } from "@sonafrik/types";
import { useWalletService } from "../lib/walletServiceContext";

export function useSubscriptionPlans() {
  const service = useWalletService();
  const [plans, setPlans] = useState<ListenerPremiumPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await service.getListenerPremiumPlans();
      setPlans(data);
    } catch (err) {
      setPlans([]);
      setError(err instanceof Error ? err.message : "Impossible de charger les plans");
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { plans, isLoading, error, reload };
}
