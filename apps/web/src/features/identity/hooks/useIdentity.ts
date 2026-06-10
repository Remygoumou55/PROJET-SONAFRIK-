"use client";

import { useMemo } from "react";
import { createIdentityService } from "@sonafrik/api/identity";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useIdentityService() {
  return useMemo(() => createIdentityService(getSupabaseBrowserClient()), []);
}
