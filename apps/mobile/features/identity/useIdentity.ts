import { useMemo } from "react";
import { createIdentityService } from "@sonafrik/api/identity";
import { getSupabaseMobileClient } from "../../lib/supabase";

export function useIdentityService() {
  return useMemo(() => createIdentityService(getSupabaseMobileClient()), []);
}
