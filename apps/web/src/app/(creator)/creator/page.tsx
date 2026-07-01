import { CreatorDashboard } from "@/features/creator/components/CreatorDashboard";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createCreatorService } from "@sonafrik/api/creator";
import { createListenerService } from "@sonafrik/api/listener";

export default async function CreatorDashboardPage() {
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const [data, careerOsEnabled] = await Promise.all([
    createCreatorService(supabase).getDashboardDataForContext(context),
    createListenerService(supabase).isFeatureEnabled("career_os"),
  ]);
  return <CreatorDashboard data={data} careerOsEnabled={careerOsEnabled} />;
}
