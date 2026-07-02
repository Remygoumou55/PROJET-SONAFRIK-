import { createCatalogService } from "@sonafrik/api/catalog";
import { PublishHome } from "@/features/creator/catalog/components/PublishHome";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CatalogTracksPage() {
  const creator = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);
  const tracks = await catalog.listTracks().catch(() => []);
  const stageName = creator.artistProfile.stage_name ?? "";
  return (
    <PublishHome
      tracks={tracks}
      creatorId={creator.creator.id}
      stageName={stageName}
    />
  );
}
