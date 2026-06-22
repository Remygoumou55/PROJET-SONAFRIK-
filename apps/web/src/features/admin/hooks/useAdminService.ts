"use client";

import { useMemo } from "react";
import { createAdminService } from "@sonafrik/api/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useAdminService() {
  return useMemo(() => createAdminService(getSupabaseBrowserClient()), []);
}
