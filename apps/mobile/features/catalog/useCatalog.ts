import { useMemo } from "react";
import { createCatalogService } from "@sonafrik/api/catalog";
import { getSupabaseMobileClient } from "../../lib/supabase";

export function useCatalogService() {
  return useMemo(() => createCatalogService(getSupabaseMobileClient()), []);
}
