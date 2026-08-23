"use client";

import { useMemo } from "react";
import { createPayoutService } from "@sonafrik/api/payout";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

/**
 * @deprecated Mutations payout admin doivent passer par `admin-financial.actions` + `useAdminActionRunner`.
 */
export function usePayoutService() {
  return useMemo(() => createPayoutService(getSupabaseBrowserClient()), []);
}
