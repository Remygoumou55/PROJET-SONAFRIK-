import { redirect } from "next/navigation";
import { createIdentityService } from "@sonafrik/api/identity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireIdentityContext() {
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);

  try {
    return await identity.getIdentityContext();
  } catch {
    redirect("/auth/connexion");
  }
}

export async function getOptionalAvatarUrl() {
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);

  try {
    return await identity.getAvatarSignedUrl();
  } catch {
    return null;
  }
}
