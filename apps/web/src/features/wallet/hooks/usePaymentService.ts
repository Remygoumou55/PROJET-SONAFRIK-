"use client";

import { useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createPaymentsService } from "@sonafrik/api/payments";

export function usePaymentService() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  return useMemo(() => createPaymentsService(client), [client]);
}
