import { cache } from "react";
import { redirect } from "next/navigation";
import { createIdentityService } from "@sonafrik/api/identity";
import { IdentityError } from "@sonafrik/api/identity";
import type { IdentityContext } from "@sonafrik/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const DEV_IDENTITY: IdentityContext = {
  profile: {
    id: "dev-bypass",
    phone: null,
    email: "dev@sonafrik.local",
    full_name: "Dev Preview",
    avatar_url: null,
    avatar_path: null,
    bio: null,
    city: null,
    country_code: null,
    account_type: "auditeur_artiste",
    locale: "fr",
    fraud_score: 0,
    onboarding_completed: true,
    is_premium: false,
    premium_expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  preferences: {
    user_id: "dev-bypass",
    language: "fr",
    audio_quality: "128",
    data_saver: false,
    autoplay_on_wifi: true,
    autoplay_on_cellular: false,
    explicit_content_allowed: false,
    profile_visibility: "public",
    show_listening_activity: true,
    push_notifications: true,
    email_notifications: true,
    sms_notifications: false,
    marketing_notifications: false,
    awards_reminders: true,
    new_releases_alerts: true,
    artist_comment_replies: true,
    timezone: "Africa/Conakry",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  roles: ["auditeur_artiste"],
  unreadNotifications: 0,
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

export async function requireIdentityContext() {
  if (process.env.BYPASS_AUTH === "true") return DEV_IDENTITY;
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
