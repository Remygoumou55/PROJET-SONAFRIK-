import { CreatorLayoutClient } from "@/features/creator/components/CreatorLayoutClient";
import { CreatorSidebar } from "@/features/creator/components/CreatorSidebar";
import { CreatorWorkspaceHeader } from "@/features/creator/components/CreatorWorkspaceHeader";
import { DevAuthBootstrap } from "@/features/identity/auth/components/DevAuthBootstrap";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { buildCreatorNavEntries } from "@/features/creator/lib/creatorNavConfig";
import { RealtimeShell } from "@/features/shared/rendering/RealtimeShell";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PerformanceProvider } from "@/lib/performance";
import { getCachedPerformanceFlags } from "@/lib/performance/server";
import { createNotificationsService } from "@sonafrik/api/notifications";
import { isDevBypassActive } from "@/lib/auth/guards";
import "@/app/styles/creator.css";

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

  const navEntries = buildCreatorNavEntries(context.pendingVerifications);

  return (
    <RealtimeShell>
      <PerformanceProvider flags={performanceFlags}>
        <DevAuthBootstrap />
        <div className="enterprise-shell creator-workspace">
          <div className="enterprise-sidebar-card">
            <CreatorSidebar navEntries={navEntries} />
          </div>
          <main className="enterprise-main-column creator-workspace__body">
            <CreatorWorkspaceHeader
              userId={context.creator.owner_id}
              initialUnreadCount={unreadCount}
              pendingVerifications={context.pendingVerifications}
            />
            <CreatorLayoutClient navEntries={navEntries}>{children}</CreatorLayoutClient>
          </main>
        </div>
      </PerformanceProvider>
    </RealtimeShell>
  );
}
