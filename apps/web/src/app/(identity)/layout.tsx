import { IdentityLayoutClient } from "@/features/identity/components/IdentityLayoutClient";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { RealtimeShell } from "@/features/shared/rendering/RealtimeShell";

/**
 * Layout async sans Suspense manuel — loading.tsx du segment gère le skeleton.
 */
export default async function IdentityLayout({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);

  return (
    <RealtimeShell>
      <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
      <IdentityLayoutClient unreadNotifications={context.unreadNotifications}>
        {children}
      </IdentityLayoutClient>
    </RealtimeShell>
  );
}
