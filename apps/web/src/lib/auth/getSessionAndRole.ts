import { mapAccountType, type RouteRole } from "./accountType";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface SessionAndRole {
  userId: string | null;
  role: RouteRole;
  onboardingCompleted: boolean;
}

export async function getSessionAndRole(): Promise<SessionAndRole> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, role: null, onboardingCompleted: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, onboarding_completed")
    .eq("id", user.id)
    .single();

  const { data: isAdmin } = await supabase.rpc("is_admin", {
    p_user_id: user.id,
  });

  const role: RouteRole = isAdmin
    ? "superadmin"
    : mapAccountType(profile?.account_type);

  return {
    userId: user.id,
    role,
    onboardingCompleted: profile?.onboarding_completed ?? false,
  };
}
