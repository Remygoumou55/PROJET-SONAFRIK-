"use client";

import { useMemo } from "react";
import { createAdminService } from "@sonafrik/api/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * @deprecated Mutations admin doivent passer par server actions + `useAdminActionRunner`.
 * Le client navigateur ne peut pas exécuter les RPC admin (notamment en BYPASS_AUTH local).
 */
export function useAdminService() {
  return useMemo(() => createAdminService(getSupabaseBrowserClient()), []);
}
