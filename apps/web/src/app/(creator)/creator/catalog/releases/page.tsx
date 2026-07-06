import { createCatalogService } from "@sonafrik/api/catalog";
import { ReleaseList } from "@/features/creator/catalog/components/ReleaseList";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function CatalogReleasesPage() {
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);
  const albums = await catalog.listAlbums();
  return (
    <ReleaseList
      albums={albums}
      creatorId={context.creator.id}
      stageName={context.artistProfile.stage_name ?? "Artiste"}
    />
  );
}
