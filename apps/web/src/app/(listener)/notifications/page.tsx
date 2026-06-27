import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createNotificationsService } from "@sonafrik/api/notifications";
import { NotificationsList } from "@/features/shared/notifications/components/NotificationsList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications — SONAFRIK" };

export default async function NotificationsPage() {
  const context = await requireIdentityContext();
  const supabase = await getSupabaseServerClient();
  const service = createNotificationsService(supabase);

  const notifications = await service
    .listNotifications({ userId: context.profile.id, limit: 50 })
    .catch(() => []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-texte-principal)" }}>
        Notifications
      </h1>
      <NotificationsList
        initialNotifications={notifications}
        userId={context.profile.id}
      />
    </div>
  );
}
