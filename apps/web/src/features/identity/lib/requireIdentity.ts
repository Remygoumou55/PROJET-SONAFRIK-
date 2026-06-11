import { cache } from "react";
import { redirect } from "next/navigation";
import { createIdentityService } from "@sonafrik/api/identity";
import { IdentityError } from "@sonafrik/api/identity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// React.cache() déduplique les appels dans le même rendu serveur :
// layout.tsx et profile/page.tsx appellent tous les deux requireIdentityContext()
// mais une seule requête DB est émise par request grâce à cette mise en cache.
const fetchIdentityContext = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);
  return identity.getIdentityContext();
});

export async function requireIdentityContext() {
  try {
    return await fetchIdentityContext();
  } catch (err) {
    // Utilisateur non authentifié → connexion
    if (err instanceof IdentityError && err.code === "unauthorized") {
      redirect("/auth/connexion");
    }
    // Profil introuvable (compte Google sans trigger) → compléter l'onboarding
    if (err instanceof IdentityError && err.code === "profile_not_found") {
      redirect("/auth/inscription");
    }
    // Vérifier la session avant de décider
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/connexion");
    }
    // Utilisateur connecté mais données incomplètes → error boundary
    throw err;
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
