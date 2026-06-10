"use client";

import { useMemo } from "react";
import { createCatalogService } from "@sonafrik/api/catalog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useCatalogService() {
  return useMemo(() => createCatalogService(getSupabaseBrowserClient()), []);
}
