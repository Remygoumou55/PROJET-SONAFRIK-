import { Suspense } from "react";
import { CreatorLayoutClient } from "@/features/creator/components/CreatorLayoutClient";
import { DevAuthBootstrap } from "@/features/identity/auth/components/DevAuthBootstrap";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { buildCreatorNavEntries } from "@/features/creator/lib/creatorNavConfig";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PerformanceProvider } from "@/lib/performance";
import { getCachedPerformanceFlags } from "@/lib/performance/server";
import { createNotificationsService } from "@sonafrik/api/notifications";
import CreatorLoading from "./loading";

async function CreatorGuard({ children }: { children: React.ReactNode }) {
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const notifications = createNotificationsService(supabase);

  const [performanceFlags, unreadCount] = await Promise.all([
    getCachedPerformanceFlags(),
    notifications.countUnread(context.creator.owner_id).catch(() => 0),
  ]);

  const avatarPath =
    context.artistProfile.profile_photo ?? context.artistProfile.cover_path;

  const navEntries = buildCreatorNavEntries(context.pendingVerifications);

  return (
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
  );
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-noir-profond text-texte-principal">
      <Suspense fallback={<CreatorLoading />}>
        <CreatorGuard>{children}</CreatorGuard>
      </Suspense>
    </div>
  );
}
