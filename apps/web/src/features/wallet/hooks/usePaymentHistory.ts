"use client";

import { useEffect, useState } from "react";
import type { PaymentIntent } from "@sonafrik/types";
import { usePaymentService } from "./usePaymentService";

export function usePaymentHistory(limit = 10) {
  const service = usePaymentService();
  const [intents, setIntents] = useState<PaymentIntent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    service
      .listUserIntents(limit)
      .then(setIntents)
      .catch(() => setIntents([]))
      .finally(() => setIsLoading(false));
  }, [service, limit]);

  return { intents, isLoading };
}
