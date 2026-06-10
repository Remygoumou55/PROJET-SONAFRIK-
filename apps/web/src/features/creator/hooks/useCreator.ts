"use client";

import { useMemo } from "react";
import { createCreatorService } from "@sonafrik/api/creator";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useCreatorService() {
  return useMemo(() => createCreatorService(getSupabaseBrowserClient()), []);
}
