import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  assertBypassForbiddenOnVercel,
  DEV_MOCK_USER_ID,
  isDevBypassActive,
} from "@/lib/auth/guards";

export async function requireAdmin(): Promise<{ userId: string }> {
  assertBypassForbiddenOnVercel();
  if (isDevBypassActive()) return { userId: DEV_MOCK_USER_ID };

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/connexion?next=/admin/live-control");
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin", {
    p_user_id: user.id,
  });

  if (adminError || !isAdmin) {
    redirect("/listen?error=admin_denied");
  }

  return { userId: user.id };
}

/** Pour server actions — retourne une erreur au lieu de redirect. */
export async function verifyAdminForAction(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  if (process.env.BYPASS_AUTH === "true" && process.env.VERCEL === "1") {
    return { ok: false, error: "Configuration invalide." };
  }
  if (isDevBypassActive()) return { ok: true, userId: DEV_MOCK_USER_ID };

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connexion requise." };

  const { data: isAdmin } = await supabase.rpc("is_admin", { p_user_id: user.id });
  if (!isAdmin) return { ok: false, error: "Accès administrateur requis." };

  return { ok: true, userId: user.id };
}
