"use client";

import { useMemo } from "react";
import { createAnalyticsService } from "@sonafrik/api/analytics";
import { createRoyaltyService } from "@sonafrik/api/royalties";
import { getSupabaseBrowserClient } from "../../../../lib/supabase/client";

export function useAnalyticsServices() {
  return useMemo(() => {
    const client = getSupabaseBrowserClient();
    return {
      analytics: createAnalyticsService(client),
      royalties: createRoyaltyService(client),
    };
  }, []);
}
