import { Suspense } from "react";
import { StreamingLayoutClient } from "@/features/listener/components/StreamingLayoutClient";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PerformanceProvider, resolvePerformanceFlags } from "@/lib/performance";
import StreamingLoading from "./loading";

async function StreamingGuard({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);

  const supabase = await getSupabaseServerClient();
  const performanceFlags = await resolvePerformanceFlags(supabase);

  return (
    <PerformanceProvider flags={performanceFlags}>
      <StreamingLayoutClient
        userId={context.profile.id}
        initialUnreadCount={context.unreadNotifications}
        audioQualityPreference={context.preferences.audio_quality}
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
