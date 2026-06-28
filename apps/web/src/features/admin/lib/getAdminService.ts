import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminService, type AdminService } from "@sonafrik/api/admin";
import { isDevBypassActive } from "@/lib/auth/guards";
import { requireAdmin } from "./requireAdmin";

/**
 * Admin connecté → client session (RLS admin, audit_logs OK).
 * BYPASS_AUTH local → service_role (vraie DB, pas de tableaux vides mockés).
 */
export async function getAdminServiceForSession(): Promise<AdminService> {
  await requireAdmin();
  if (isDevBypassActive()) {
    return createAdminService(getSupabaseAdminClient({ adminVerified: true }));
  }
  const supabase = await getSupabaseServerClient();
  return createAdminService(supabase);
}

/** Alias explicite (live-control, flags, settings). */
export async function getAdminServiceWithServiceRole(): Promise<AdminService> {
  await requireAdmin();
  return createAdminService(getSupabaseAdminClient({ adminVerified: true }));
}
