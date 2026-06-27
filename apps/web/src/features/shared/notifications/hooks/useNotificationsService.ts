"use client";

import { useMemo } from "react";
import { createNotificationsService } from "@sonafrik/api/notifications";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useNotificationsService() {
  return useMemo(() => createNotificationsService(getSupabaseBrowserClient()), []);
}
