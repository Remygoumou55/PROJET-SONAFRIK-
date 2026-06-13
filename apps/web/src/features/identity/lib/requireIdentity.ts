import { cache } from "react";
import { redirect } from "next/navigation";
import { createIdentityService } from "@sonafrik/api/identity";
import { IdentityError } from "@sonafrik/api/identity";
import type { IdentityContext } from "@sonafrik/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// ── DEV BYPASS ────────────────────────────────────────────────────────────────
// Activé via BYPASS_AUTH=true dans .env.local — désactiver avant déploiement
const DEV_MOCK_IDENTITY: IdentityContext = {
  profile: {
    id: "dev-mock-id",
    phone: "+224000000000",
    email: "dev@sonafrik.test",
    full_name: "Dev Testeur",
    avatar_url: null,
    avatar_path: null,
    bio: null,
    city: "Conakry",
    country_code: "GN",
    account_type: "auditeur_artiste",
    locale: "fr",
    fraud_score: 0,
    onboarding_completed: true,
    is_premium: true,
    premium_expires_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    deleted_at: null,
  },
  preferences: {
    user_id: "dev-mock-id",
    language: "fr",
    audio_quality: "auto",
    data_saver: false,
    autoplay_on_wifi: true,
    autoplay_on_cellular: false,
    explicit_content_allowed: true,
    profile_visibility: "public",
    show_listening_activity: true,
    push_notifications: true,
    email_notifications: true,
    sms_notifications: true,
    marketing_notifications: false,
    awards_reminders: true,
    new_releases_alerts: true,
    artist_comment_replies: true,
    timezone: "Africa/Conakry",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  roles: [],
  unreadNotifications: 2,
  activeSessions: 1,
};

// React.cache() déduplique les appels dans le même rendu serveur :
// layout.tsx et profile/page.tsx appellent tous les deux requireIdentityContext()
// mais une seule requête DB est émise par request grâce à cette mise en cache.
const fetchIdentityContext = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);
  return identity.getIdentityContext();
});

export async function requireIdentityContext(): Promise<IdentityContext> {
  if (process.env.BYPASS_AUTH === "true") return DEV_MOCK_IDENTITY;

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
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    redirect(user ? "/auth/inscription" : "/auth/connexion");
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
