import { StreamingLayoutClient } from "@/features/listener/components/StreamingLayoutClient";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { getListenSidebarData } from "@/features/listener/lib/getListenSidebarData";
import { RealtimeShell } from "@/features/shared/rendering/RealtimeShell";
import { PerformanceProvider } from "@/lib/performance";
import { getCachedPerformanceFlags } from "@/lib/performance/server";
import { getCachedListenFeatureFlags } from "@/lib/listen/get-cached-listen-feature-flags";
import "@/app/styles/listen-home-bundle.css";

/**
 * Layout async sans Suspense manuel — loading.tsx du segment gère le skeleton.
 * Évite le blocage infini quand redirect() est appelé dans un boundary Suspense.
 */
export default async function StreamingLayout({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);

  const [performanceFlags, listenFeatures] = await Promise.all([
    getCachedPerformanceFlags(),
    getCachedListenFeatureFlags(),
  ]);
  const sidebarDataPromise = getListenSidebarData(context.profile.id);

  return (
    <RealtimeShell>
      <link rel="prefetch" href="/library" as="document" />
      <link rel="prefetch" href="/search" as="document" />
      <PerformanceProvider flags={performanceFlags}>
        <StreamingLayoutClient
        userId={context.profile.id}
        initialUnreadCount={context.unreadNotifications}
        audioQualityPreference={context.preferences.audio_quality}
        sidebarDataPromise={sidebarDataPromise}
        listenFeatures={listenFeatures}
      >
        {children}
      </StreamingLayoutClient>
    </PerformanceProvider>
    </RealtimeShell>
  );
}
