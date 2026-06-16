import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin(): Promise<{ userId: string }> {
  if (process.env.BYPASS_AUTH === "true" && process.env.VERCEL === "1") {
    throw new Error("BYPASS_AUTH ne doit jamais être actif en production");
  }
  // Même logique que le middleware : bypass si BYPASS_AUTH=true OU NODE_ENV=development, jamais sur Vercel
  const isBypassMode =
    (process.env.BYPASS_AUTH === "true" || process.env.NODE_ENV === "development") &&
    process.env.VERCEL !== "1";
  if (isBypassMode) return { userId: "dev-mock-id" };

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/connexion");

  const { data: isAdmin } = await supabase.rpc("is_admin", { p_user_id: user.id });

  if (!isAdmin) redirect("/");

  return { userId: user.id };
}
