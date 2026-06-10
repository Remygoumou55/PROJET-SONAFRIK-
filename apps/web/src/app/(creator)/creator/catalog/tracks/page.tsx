import { createCatalogService } from "@sonafrik/api/catalog";
import { TrackList } from "@/features/catalog/components/TrackList";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CatalogTracksPage() {
  await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);
  const [tracks, context] = await Promise.all([catalog.listTracks(), catalog.getCatalogContext()]);
  return <TrackList tracks={tracks} creatorId={context.creatorId} />;
}
