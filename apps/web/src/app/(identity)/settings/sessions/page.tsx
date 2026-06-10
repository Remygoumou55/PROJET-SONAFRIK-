import { createIdentityService } from "@sonafrik/api/identity";
import { SessionList } from "@/features/identity/components/SessionList";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function SessionsPage() {
  await requireIdentityContext();
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);
  const sessions = await identity.getActiveSessions();

  return <SessionList sessions={sessions} />;
}
