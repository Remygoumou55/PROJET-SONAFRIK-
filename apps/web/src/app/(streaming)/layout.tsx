import { Suspense } from "react";
import { StreamingLayoutClient } from "@/features/streaming/components/StreamingLayoutClient";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createNotificationsService } from "@sonafrik/api/notifications";
import StreamingLoading from "./loading";

async function StreamingGuard({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);

  // BYPASS_AUTH → profil mock avec unreadNotifications déjà défini, pas besoin de requêter la DB
  const isBypass = process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1";
  let unreadCount = context.unreadNotifications;
  if (!isBypass) {
    const supabase = await getSupabaseServerClient();
    const notifService = createNotificationsService(supabase);
    unreadCount = await notifService.countUnread(context.profile.id).catch(() => 0);
  }

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
