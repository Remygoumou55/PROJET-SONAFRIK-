"use client";

import { useMemo } from "react";
import { createRightsService } from "@sonafrik/api/rights";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useRightsService() {
  return useMemo(() => createRightsService(getSupabaseBrowserClient()), []);
}
