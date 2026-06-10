import { createCreatorService } from "@sonafrik/api/creator";
import { TeamManager } from "@/features/creator/components/TeamManager";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CreatorTeamPage() {
  await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const creator = createCreatorService(supabase);
  const team = await creator.getTeam();
  return <TeamManager team={team} />;
}
