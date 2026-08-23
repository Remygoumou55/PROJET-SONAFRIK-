"use client";

import { useMemo } from "react";
import { createStreamingService } from "@sonafrik/api/streaming";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

export function useStreamingService() {
  return useMemo(() => createStreamingService(getSupabaseBrowserClient()), []);
}
