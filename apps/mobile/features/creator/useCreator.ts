import { useMemo } from "react";
import { createCreatorService } from "@sonafrik/api/creator";
import { getSupabaseMobileClient } from "../../lib/supabase";

export function useCreatorService() {
  return useMemo(() => createCreatorService(getSupabaseMobileClient()), []);
}
