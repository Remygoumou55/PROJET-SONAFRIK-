import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/connexion");

  const { data } = await supabase
    .from("user_roles" as never)
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle() as { data: { role: string } | null };

  if (!data) redirect("/");

  return { userId: user.id };
}
