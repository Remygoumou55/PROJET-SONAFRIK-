import { IdentityLayoutClient } from "@/features/identity/components/IdentityLayoutClient";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";

export default async function IdentityLayout({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);

  return (
    <IdentityLayoutClient unreadNotifications={context.unreadNotifications}>
      {children}
    </IdentityLayoutClient>
  );
}
