"use client";

import { useCallback } from "react";
import type { PaymentIntent } from "@sonafrik/types";
import { PAYMENT_ERROR_MESSAGES } from "@sonafrik/types";
import { usePaymentService } from "./usePaymentService";
import { useWalletUserId } from "./useWalletUserId";
import { useWalletSrtspLiveQuery } from "./useWalletSrtspLiveQuery";

export function usePaymentHistory(limit = 10) {
  const service = usePaymentService();
  const userId = useWalletUserId();

  const fetchHistory = useCallback(async (): Promise<PaymentIntent[]> => {
    try {
      return await service.listUserIntents(limit);
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error(PAYMENT_ERROR_MESSAGES.unknown ?? "Une erreur est survenue.");
    }
  }, [service, limit]);

  const {
    data: intents,
    loading: isLoading,
    error: liveError,
  } = useWalletSrtspLiveQuery<PaymentIntent[]>({
    userId,
    queryKey: userId ? `wallet-payments:${userId}:${limit}` : "wallet-payments:pending",
    fetcher: fetchHistory,
    initialData: [],
    enabled: Boolean(userId),
  });

  const error: string | null = liveError?.message ?? null;

  return { intents: intents ?? [], isLoading: isLoading || !userId, error };
}
