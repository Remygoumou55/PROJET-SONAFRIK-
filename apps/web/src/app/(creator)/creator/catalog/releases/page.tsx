import { createCatalogService } from "@sonafrik/api/catalog";
import { ReleaseList } from "@/features/catalog/components/ReleaseList";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CatalogReleasesPage() {
  await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);
  const [albums, context] = await Promise.all([catalog.listAlbums(), catalog.getCatalogContext()]);
  return <ReleaseList albums={albums} creatorId={context.creatorId} />;
}
