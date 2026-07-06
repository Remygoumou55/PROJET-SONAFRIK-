import { CreatorLayoutClient } from "@/features/creator/components/CreatorLayoutClient";
import { DevAuthBootstrap } from "@/features/identity/auth/components/DevAuthBootstrap";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { buildCreatorNavEntries } from "@/features/creator/lib/creatorNavConfig";
import { RealtimeShell } from "@/features/shared/rendering/RealtimeShell";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PerformanceProvider } from "@/lib/performance";
import { getCachedPerformanceFlags } from "@/lib/performance/server";
import { createNotificationsService } from "@sonafrik/api/notifications";
import { isDevBypassActive } from "@/lib/auth/guards";

/**
 * Layout async sans Suspense manuel — loading.tsx du segment gère le skeleton.
 * Évite le blocage infini quand redirect() est appelé dans un boundary Suspense.
 */
export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const notifications = createNotificationsService(supabase);

  const [performanceFlags, unreadCount] = await Promise.all([
    getCachedPerformanceFlags(),
    isDevBypassActive()
      ? Promise.resolve(0)
      : notifications.countUnread(context.creator.owner_id).catch(() => 0),
  ]);

  const avatarPath =
    context.artistProfile.profile_photo ?? context.artistProfile.cover_path;

  const navEntries = buildCreatorNavEntries(context.pendingVerifications);

  return (
    <RealtimeShell>
      <PerformanceProvider flags={performanceFlags}>
      <DevAuthBootstrap />
      <CreatorLayoutClient
        navEntries={navEntries}
        pendingVerifications={context.pendingVerifications}
        userId={context.creator.owner_id}
        initialUnreadCount={unreadCount}
        stageName={context.artistProfile.stage_name || "Artiste"}
        creatorId={context.creator.id}
        avatarPath={avatarPath}
        tier={context.creator.tier}
      >
        {children}
      </CreatorLayoutClient>
    </PerformanceProvider>
    </RealtimeShell>
  );
}
