import { cache } from "react";
import { redirect } from "next/navigation";
import { createIdentityService } from "@sonafrik/api/identity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// cache() déduplique les appels identiques dans le même arbre de rendu (layout + page)
export const requireIdentityContext = cache(async function requireIdentityContext() {
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);

  try {
    return await identity.getIdentityContext();
  } catch {
    redirect("/auth/connexion");
  }
});

export async function getOptionalAvatarUrl() {
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);

  try {
    return await identity.getAvatarSignedUrl();
  } catch {
    return null;
  }
}
