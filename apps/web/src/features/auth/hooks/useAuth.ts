"use client";

import { useMemo } from "react";
import { createAuthService } from "@sonafrik/api/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useAuthService() {
  return useMemo(() => createAuthService(getSupabaseBrowserClient()), []);
}
