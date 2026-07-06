import { createCreatorService } from "@sonafrik/api/creator";
import { TeamManager } from "@/features/creator/components/TeamManager";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CreatorTeamPage() {
  const supabase = await getSupabaseServerClient();
  const creator = createCreatorService(supabase);
  const team = await creator.getTeam();
  return <TeamManager team={team} />;
}
