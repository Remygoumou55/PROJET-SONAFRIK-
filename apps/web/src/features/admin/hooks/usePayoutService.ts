"use client";

import { useMemo } from "react";
import { createPayoutService } from "@sonafrik/api/payout";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function usePayoutService() {
  return useMemo(() => createPayoutService(getSupabaseBrowserClient()), []);
}
