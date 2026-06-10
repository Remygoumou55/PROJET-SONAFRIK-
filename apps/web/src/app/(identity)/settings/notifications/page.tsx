import { createIdentityService } from "@sonafrik/api/identity";
import { NotificationList } from "@/features/identity/components/NotificationList";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  await requireIdentityContext();
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);
  const notifications = await identity.getNotifications();

  return <NotificationList notifications={notifications} />;
}
