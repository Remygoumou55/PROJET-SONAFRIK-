import { ProfileEditForm } from "@/features/identity/components/ProfileEditForm";
import {
  getOptionalAvatarUrl,
  requireIdentityContext,
} from "@/features/identity/lib/requireIdentity";

export default async function ProfileEditPage() {
  const [context, avatarUrl] = await Promise.all([
    requireIdentityContext(),
    getOptionalAvatarUrl(),
  ]);

  return <ProfileEditForm profile={context.profile} avatarUrl={avatarUrl} />;
}
