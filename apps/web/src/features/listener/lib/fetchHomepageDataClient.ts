import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchHomepageData } from "./fetchHomepageData";

/** Refresh accueil auditeur côté client (SRTSP Phase 3.8). */
export async function fetchHomepageDataClient(category: string) {
  return fetchHomepageData(getSupabaseBrowserClient(), category);
}
