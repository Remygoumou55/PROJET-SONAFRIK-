import { redirect } from "next/navigation";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  assertBypassForbiddenOnVercel,
  DEV_MOCK_USER_ID,
  isDevBypassActive,
} from "@/lib/auth/guards";

async function resolveIsAdmin(userId: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  const { data: isAdmin, error } = await supabase.rpc("is_admin", { p_user_id: userId });

  if (!error && isAdmin === true) return true;

  // Repli service_role — évite faux refus si RPC anon timeout/erreur (cold start Supabase)
  try {
    const admin = getSupabaseAdminClient(
      process.env.VERCEL === "1" ? { adminVerified: true } : undefined,
    );
    const { data: fallback } = await admin.rpc("is_admin", { p_user_id: userId });
    return fallback === true;
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<{ userId: string }> {
  assertBypassForbiddenOnVercel();
  if (isDevBypassActive()) return { userId: DEV_MOCK_USER_ID };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/connexion?next=/admin");
  }

  const isAdmin = await resolveIsAdmin(user.id);

  if (!isAdmin) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connexion requise." };

  const isAdmin = await resolveIsAdmin(user.id);
  if (!isAdmin) return { ok: false, error: "Accès administrateur requis." };

  return { ok: true, userId: user.id };
}
