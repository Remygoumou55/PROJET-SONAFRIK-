import { createCreatorService } from "@sonafrik/api/creator";
import { LabelManager } from "@/features/creator/components/LabelManager";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CreatorLabelsPage() {
  const supabase = await getSupabaseServerClient();
  const creator = createCreatorService(supabase);
  const labels = await creator.getMyLabels();
  return <LabelManager labels={labels} />;
}
