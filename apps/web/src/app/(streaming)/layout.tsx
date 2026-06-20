import { Suspense } from "react";
import { StreamingLayoutClient } from "@/features/streaming/components/StreamingLayoutClient";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createNotificationsService } from "@sonafrik/api/notifications";
import StreamingLoading from "./loading";

async function StreamingGuard({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);

  const supabase = await getSupabaseServerClient();
  const notifService = createNotificationsService(supabase);
  const unreadCount = await notifService.countUnread(context.profile.id).catch(() => 0);

  return (
    <StreamingLayoutClient
      userId={context.profile.id}
      initialUnreadCount={unreadCount}
      audioQualityPreference={context.preferences.audio_quality}
    >
      {children}
    </StreamingLayoutClient>
  );
}

export default function StreamingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<StreamingLoading />}>
      <StreamingGuard>{children}</StreamingGuard>
    </Suspense>
  );
}
