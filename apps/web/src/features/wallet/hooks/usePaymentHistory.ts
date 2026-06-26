"use client";

import { useEffect, useState } from "react";
import type { PaymentIntent } from "@sonafrik/types";
import { PAYMENT_ERROR_MESSAGES } from "@sonafrik/types";
import { PaymentError } from "@sonafrik/api/payments";
import { usePaymentService } from "./usePaymentService";

export function usePaymentHistory(limit = 10) {
  const service = usePaymentService();
  const [intents, setIntents] = useState<PaymentIntent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    service
      .listUserIntents(limit)
      .then(setIntents)
      .catch((err: unknown) => {
        setIntents([]);
        if (err instanceof PaymentError) {
          setError(err.message);
        } else {
          setError(PAYMENT_ERROR_MESSAGES.unknown ?? "Une erreur est survenue.");
        }
      })
      .finally(() => setIsLoading(false));
  }, [service, limit]);

  return { intents, isLoading, error };
}
