import type { Metadata } from "next";
import { ProfileHeader } from "@/features/identity/components/ProfileHeader";
import {
  getOptionalAvatarUrl,
  requireIdentityContext,
} from "@/features/identity/lib/requireIdentity";
import { getProfileActivity } from "@/features/identity/lib/getProfileActivity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createListenerService } from "@sonafrik/api/listener";

export const metadata: Metadata = { title: "Mon profil — SONAFRIK" };

export default async function ProfilePage() {
  const context = await requireIdentityContext();
  const supabase = await getSupabaseServerClient();
  const listener = createListenerService(supabase);

  const [avatarUrl, activity, profileOsEnabled] = await Promise.all([
    getOptionalAvatarUrl(),
    getProfileActivity(context.profile),
    listener.isFeatureEnabled("profile_os"),
  ]);

  return (
    <ProfileHeader
      context={context}
      avatarUrl={avatarUrl}
      activity={activity}
      profileOsEnabled={profileOsEnabled}
    />
  );
}
