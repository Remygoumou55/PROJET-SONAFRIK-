import { cache } from "react";
import { redirect } from "next/navigation";
import { createAuthService } from "@sonafrik/api/auth";
import { createCreatorService } from "@sonafrik/api/creator";
import type { CreatorContext } from "@sonafrik/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertBypassForbiddenOnVercel, isDevBypassActive } from "@/lib/auth/guards";

// ── DEV BYPASS ────────────────────────────────────────────────────────────────
const DEV_MOCK_CREATOR: CreatorContext = {
  creator: {
    id: "dev-creator-id",
    owner_id: "dev-mock-id",
    label_id: null,
    status: "active",
    tier: "emergent",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    deleted_at: null,
  },
  artistProfile: {
    creator_id: "dev-creator-id",
    stage_name: "Dev Artiste",
    slug: "dev-artiste",
    bio: "Profil de test pour contrôle visuel",
    genres: ["Afrobeat", "Mandingue"],
    banner_path: null,
    cover_path: null,
    profile_photo: null,
    cover_images: [],
    cover_updated_at: null,
    social_links: {},
    is_public: true,
    verified: false,
    verified_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  teamCount: 1,
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
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 12000)
    );
    return await Promise.race([creator.getCreatorContext(), timeout]);
  } catch {
    redirect("/profile");
  }
});

export async function requireCreatorContext(): Promise<CreatorContext> {
  assertBypassForbiddenOnVercel();
  if (isDevBypassActive()) return DEV_MOCK_CREATOR;
  return fetchCreatorContext();
}
