"use client";

import { useMemo } from "react";
import { createSocialService } from "@sonafrik/api/social";
import { getSupabaseBrowserClient } from "../../../../lib/supabase/client";

export function useSocialService() {
  return useMemo(() => createSocialService(getSupabaseBrowserClient()), []);
}
