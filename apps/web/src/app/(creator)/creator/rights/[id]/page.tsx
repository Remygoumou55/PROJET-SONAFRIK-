import { notFound } from "next/navigation";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createRightsService } from "@sonafrik/api/rights";
import { WorkDetail } from "@/features/rights/components/WorkDetail";

export const metadata = { title: "Détail œuvre — Creator OS SONAFRIK" };

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const rights = createRightsService(supabase);

  const work = await rights.getWorkDetails({ workId: id }).catch(() => null);

  if (!work || work.creator_id !== context.creator.id) notFound();

  return (
    <WorkDetail work={work} creatorId={context.creator.id} />
  );
}
