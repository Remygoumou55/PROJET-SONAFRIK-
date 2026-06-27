import { Suspense } from "react";
import { CreatorLayoutClient } from "@/features/creator/components/CreatorLayoutClient";
import { DevAuthBootstrap } from "@/features/auth/components/DevAuthBootstrap";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PerformanceProvider, resolvePerformanceFlags } from "@/lib/performance";
import { createNotificationsService } from "@sonafrik/api/notifications";
import CreatorLoading from "./loading";

async function CreatorGuard({ children }: { children: React.ReactNode }) {
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const notifications = createNotificationsService(supabase);

  const [performanceFlags, unreadCount] = await Promise.all([
    resolvePerformanceFlags(supabase),
    notifications.countUnread(context.creator.owner_id).catch(() => 0),
  ]);

  const avatarPath =
    context.artistProfile.profile_photo ?? context.artistProfile.cover_path;

  return (
    <PerformanceProvider flags={performanceFlags}>
      <DevAuthBootstrap />
      <CreatorLayoutClient
        pendingVerifications={context.pendingVerifications}
        userId={context.creator.owner_id}
        initialUnreadCount={unreadCount}
        stageName={context.artistProfile.stage_name}
        creatorId={context.creator.id}
        avatarPath={avatarPath}
      >
        {children}
      </CreatorLayoutClient>
    </PerformanceProvider>
  );
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<CreatorLoading />}>
      <CreatorGuard>{children}</CreatorGuard>
    </Suspense>
  );
}
