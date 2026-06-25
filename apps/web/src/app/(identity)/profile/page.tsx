import type { Metadata } from "next";
import { ProfileHeader } from "@/features/identity/components/ProfileHeader";
import {
  getOptionalAvatarUrl,
  requireIdentityContext,
} from "@/features/identity/lib/requireIdentity";
import { getProfileActivity } from "@/features/identity/lib/getProfileActivity";

export const metadata: Metadata = { title: "Mon profil — SONAFRIK" };

export default async function ProfilePage() {
  const context = await requireIdentityContext();
  const [avatarUrl, activity] = await Promise.all([
    getOptionalAvatarUrl(),
    getProfileActivity(context.profile),
  ]);

  return <ProfileHeader context={context} avatarUrl={avatarUrl} activity={activity} />;
}
