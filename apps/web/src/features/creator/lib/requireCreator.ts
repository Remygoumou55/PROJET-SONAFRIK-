import { cache } from "react";
import { redirect } from "next/navigation";
import { createAuthService } from "@sonafrik/api/auth";
import { createCreatorService } from "@sonafrik/api/creator";
import type { CreatorContext } from "@sonafrik/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const DEV_CREATOR: CreatorContext = {
  creator: {
    id: "dev-creator",
    owner_id: "dev-bypass",
    label_id: null,
    status: "active",
    tier: "emergent",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  artistProfile: {
    creator_id: "dev-creator",
    stage_name: "Dev Artist",
    slug: "dev-artist",
    bio: null,
    genres: [],
    banner_path: null,
    cover_path: null,
    social_links: {},
    is_public: true,
    verified: false,
    verified_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  teamCount: 0,
  labelCount: 0,
  pendingVerifications: 0,
  studios: [],
};

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
  if (process.env.BYPASS_AUTH === "true") return DEV_CREATOR;
  return fetchCreatorContext();
}
