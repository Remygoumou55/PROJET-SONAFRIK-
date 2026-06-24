import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminService, type AdminService } from "@sonafrik/api/admin";
import { requireAdmin } from "./requireAdmin";

/** AdminService avec JWT utilisateur (RLS admin). */
export async function getAdminServiceForSession(): Promise<AdminService> {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  return createAdminService(supabase);
}

/** AdminService avec service role — flags/settings uniquement. */
export async function getAdminServiceWithServiceRole(): Promise<AdminService> {
  await requireAdmin();
  return createAdminService(getSupabaseAdminClient({ adminVerified: true }));
}
