import { ProfileHeader } from "@/features/identity/components/ProfileHeader";
import {
  getOptionalAvatarUrl,
  requireIdentityContext,
} from "@/features/identity/lib/requireIdentity";

export default async function ProfilePage() {
  const [context, avatarUrl] = await Promise.all([
    requireIdentityContext(),
    getOptionalAvatarUrl(),
  ]);

  return <ProfileHeader context={context} avatarUrl={avatarUrl} />;
}
