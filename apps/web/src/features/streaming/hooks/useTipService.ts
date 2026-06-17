"use client";

import { useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createTipsService } from "@sonafrik/api/tips";

export function useTipService() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  return useMemo(() => createTipsService(client), [client]);
}
