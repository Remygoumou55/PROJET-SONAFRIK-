import { createIdentityService } from "@sonafrik/api/identity";
import { SessionList } from "@/features/identity/components/SessionList";
import { PrivacySection } from "@/features/identity/components/PrivacySection";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function SessionsPage() {
  const context = await requireIdentityContext();
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);
  const sessions = await identity.getActiveSessions();

  return (
    <div className="space-y-6">
      <SessionList sessions={sessions} />
      <PrivacySection preferences={context.preferences} />
    </div>
  );
}
