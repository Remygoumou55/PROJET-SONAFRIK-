import { createCatalogService } from "@sonafrik/api/catalog";
import { TrackList } from "@/features/creator/catalog/components/TrackList";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

export default async function CatalogTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  await requireCreatorContext();
  const { page: pageParam, q, status: statusParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const search = q?.trim() ?? "";
  const status = statusParam ?? "all";
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);
  const { tracks, total } = await catalog.listTracksPage({
    limit: PAGE_SIZE,
    offset,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
  });

  return (
    <TrackList
      tracks={tracks}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      search={search}
      status={status}
    />
  );
}
