import { Suspense } from "react";
import { StreamingLayoutClient } from "@/features/listener/components/StreamingLayoutClient";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { getListenSidebarData } from "@/features/listener/lib/getListenSidebarData";
import { PerformanceProvider } from "@/lib/performance";
import { getCachedPerformanceFlags } from "@/lib/performance/server";
import StreamingLoading from "./loading";
import "@/app/styles/listen-home.css";

async function StreamingGuard({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);

  const [performanceFlags, sidebarData] = await Promise.all([
    getCachedPerformanceFlags(),
    getListenSidebarData(context.profile.id),
  ]);

  return (
    <PerformanceProvider flags={performanceFlags}>
      <StreamingLayoutClient
        userId={context.profile.id}
        initialUnreadCount={context.unreadNotifications}
        audioQualityPreference={context.preferences.audio_quality}
        sidebarData={sidebarData}
      >
        {children}
      </StreamingLayoutClient>
    </PerformanceProvider>
  );
}

export default function StreamingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<StreamingLoading />}>
      <StreamingGuard>{children}</StreamingGuard>
    </Suspense>
  );
}
