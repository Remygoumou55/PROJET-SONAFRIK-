import { StreamingLayoutClient } from "@/features/streaming/components/StreamingLayoutClient";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createNotificationsService } from "@sonafrik/api/notifications";

export default async function StreamingLayout({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);

  const supabase = await getSupabaseServerClient();
  const notifService = createNotificationsService(supabase);
  const unreadCount = await notifService.countUnread(context.profile.id).catch(() => 0);

  return (
    <StreamingLayoutClient
      userId={context.profile.id}
      initialUnreadCount={unreadCount}
    >
      {children}
    </StreamingLayoutClient>
  );
}
