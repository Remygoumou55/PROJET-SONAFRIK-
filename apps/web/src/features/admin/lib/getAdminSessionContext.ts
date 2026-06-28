import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "./requireAdmin";

export type AdminSessionContext = {
  fullName: string;
  initials: string;
};

export async function getAdminSessionContext(): Promise<AdminSessionContext> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { fullName: "Administrateur", initials: "SA" };
  }

  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName = (data?.full_name as string | null)?.trim() || "Administrateur";
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SA";

  return { fullName, initials };
}

/** Alias explicite pour les pages admin (prompt Sprint Admin). */
export const requireAdminAuth = requireAdmin;
