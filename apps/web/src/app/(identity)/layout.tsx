import { IdentityLayoutClient } from "@/features/identity/components/IdentityLayoutClient";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { RealtimeShell } from "@/features/shared/rendering/RealtimeShell";
import { PerformanceProvider } from "@/lib/performance";
import { getCachedPerformanceFlags } from "@/lib/performance/server";
import "@/app/styles/identity.css";
import "@/app/styles/identity-account.css";

/**
 * Layout async sans Suspense manuel — loading.tsx du segment gère le skeleton.
 */
export default async function IdentityLayout({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);
  const performanceFlags = await getCachedPerformanceFlags();

  return (
    <RealtimeShell>
      <PerformanceProvider flags={performanceFlags}>
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <IdentityLayoutClient unreadNotifications={context.unreadNotifications}>
          {children}
        </IdentityLayoutClient>
      </PerformanceProvider>
    </RealtimeShell>
  );
}
