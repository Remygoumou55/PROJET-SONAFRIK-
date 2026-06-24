import { createCatalogService } from "@sonafrik/api/catalog";
import { TrackList } from "@/features/creator/catalog/components/TrackList";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CatalogTracksPage() {
  const creator = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);
  const [tracks, context] = await Promise.all([catalog.listTracks(), catalog.getCatalogContext()]);
  const stageName = creator.artistProfile?.stage_name ?? "";
  return <TrackList tracks={tracks} creatorId={context.creatorId} stageName={stageName} />;
}
