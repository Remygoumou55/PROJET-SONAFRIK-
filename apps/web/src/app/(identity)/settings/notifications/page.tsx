import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createNotificationsService } from "@sonafrik/api/notifications";
import { NotificationsList } from "@/features/notifications/components/NotificationsList";

export default async function SettingsNotificationsPage() {
  const context = await requireIdentityContext();
  const supabase = await getSupabaseServerClient();
  const service = createNotificationsService(supabase);

  const notifications = await service
    .listNotifications({ userId: context.profile.id, limit: 50 })
    .catch(() => []);

  return (
    <div className="space-y-4">
      <NotificationsList initialNotifications={notifications} userId={context.profile.id} />
    </div>
  );
}
