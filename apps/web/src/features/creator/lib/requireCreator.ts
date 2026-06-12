import { cache } from "react";
import { redirect } from "next/navigation";
import { createAuthService } from "@sonafrik/api/auth";
import { createCreatorService } from "@sonafrik/api/creator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// React.cache() déduplique les appels dans le même rendu serveur :
// CreatorLayout + sous-pages appellent requireCreatorContext()
// mais une seule requête DB est émise par request.
const fetchCreatorContext = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const auth = createAuthService(supabase);
  const profile = await auth.getCurrentProfile();

  if (!profile) redirect("/auth/connexion");

  if (
    !profile.onboarding_completed ||
    (profile.account_type !== "artiste" && profile.account_type !== "auditeur_artiste")
  ) {
    redirect("/profile");
  }

  const creator = createCreatorService(supabase);

  try {
    return await creator.getCreatorContext();
  } catch {
    redirect("/profile");
  }
});

export async function requireCreatorContext() {
  return fetchCreatorContext();
}
