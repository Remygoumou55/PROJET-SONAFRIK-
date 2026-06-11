import { redirect } from "next/navigation";
import { createIdentityService } from "@sonafrik/api/identity";
import { IdentityError } from "@sonafrik/api/identity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireIdentityContext() {
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);

  try {
    return await identity.getIdentityContext();
  } catch (err) {
    // Rediriger uniquement si l'utilisateur n'est pas authentifié
    if (err instanceof IdentityError && err.code === "unauthorized") {
      redirect("/auth/connexion");
    }
    // Autres erreurs (données manquantes) → vérifier la session avant de rediriger
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/connexion");
    }
    // Utilisateur connecté mais données incomplètes → laisser l'error boundary gérer
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
