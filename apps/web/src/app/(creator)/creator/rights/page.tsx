import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createRightsService } from "@sonafrik/api/rights";
import { WorksPageClient } from "@/features/creator/rights/components/WorksPageClient";

export const metadata = { title: "Droits et contrats — SONAFRIK" };

export default async function RightsPage() {
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const rights = createRightsService(supabase);

  const works = await rights
    .listWorks({ creatorId: context.creator.id, limit: 50, offset: 0 })
    .catch(() => []);

  return (
    <WorksPageClient works={works} creatorId={context.creator.id} />
  );
}
