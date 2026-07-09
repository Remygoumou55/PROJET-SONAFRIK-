"use client";

import { useCallback, useEffect, useState } from "react";
import type { PaymentIntent } from "@sonafrik/types";
import { PAYMENT_ERROR_MESSAGES } from "@sonafrik/types";
import { usePaymentService } from "./usePaymentService";
import { useWalletUserId } from "./useWalletUserId";

/** Historique des recharges Mobile Money — fetch simple côté client. */
export function usePaymentHistory(limit = 50) {
  const service = usePaymentService();
  const { userId, ready: authReady } = useWalletUserId();
  const [intents, setIntents] = useState<PaymentIntent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const rows = await service.listUserIntents(limit);
      setIntents(rows);
    } catch (err: unknown) {
      setIntents([]);
      setError(
        err instanceof Error
          ? err.message
          : PAYMENT_ERROR_MESSAGES.unknown ?? "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [service, limit, userId]);

  useEffect(() => {
    if (!authReady || !userId) return;
    void load();
  }, [authReady, userId, load]);

  return {
    intents,
    isLoading: !authReady || isLoading,
    error,
    reload: load,
  };
}
