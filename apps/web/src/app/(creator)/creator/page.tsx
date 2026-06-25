import { CreatorDashboard } from "@/features/creator/components/CreatorDashboard";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createCreatorService } from "@sonafrik/api/creator";

export default async function CreatorDashboardPage() {
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const data = await createCreatorService(supabase).getDashboardDataForContext(context);
  return <CreatorDashboard data={data} />;
}
