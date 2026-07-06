import {
  createCatalogService,
  normalizePublicationSort,
  parsePublicationLibraryQuery,
} from "@sonafrik/api/catalog";
import { PublicationsLibrary } from "@/features/creator/publications";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

export default async function CatalogTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; sort?: string }>;
}) {
  const creator = await requireCreatorContext();
  const { page: pageParam, q, status: statusParam, sort: sortParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const search = q?.trim() ?? "";
  const status = statusParam ?? "all";
  const sortUi = sortParam === "title" ? "title" : "updated";

  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);
  let tracks: Awaited<ReturnType<typeof catalog.listTracksPage>>["tracks"] = [];
  let total = 0;
  let catalogTotal = 0;
  let albumsById: Record<string, Awaited<ReturnType<typeof catalog.listAlbumsByIds>>[number]> = {};

  const libraryQuery = parsePublicationLibraryQuery({
    q: search,
    status,
    sort: sortUi,
    page,
    pageSize: PAGE_SIZE,
  });

  try {
    const [pageResult, unfilteredTotal] = await Promise.all([
      catalog.listTracksPage({
        limit: libraryQuery.limit,
        offset: libraryQuery.offset,
        search: libraryQuery.search,
        status: libraryQuery.status !== "all" ? libraryQuery.status : undefined,
        sort: libraryQuery.sort ?? normalizePublicationSort(sortUi),
        searchFields: libraryQuery.searchFields,
      }),
      catalog.countCreatorTracks(),
    ]);
    ({ tracks, total } = pageResult);
    catalogTotal = unfilteredTotal;

    const albumIds = [...new Set(tracks.map((t) => t.album_id).filter((id): id is string => Boolean(id)))];
    const albums = albumIds.length > 0 ? await catalog.listAlbumsByIds(albumIds) : [];
    albumsById = Object.fromEntries(albums.map((album) => [album.id, album]));
  } catch {
    tracks = [];
    total = 0;
    catalogTotal = 0;
    albumsById = {};
  }

  return (
    <PublicationsLibrary
      tracks={tracks}
      total={total}
      catalogTotal={catalogTotal}
      creatorId={creator.creator.id}
      page={page}
      pageSize={PAGE_SIZE}
      search={search}
      status={status}
      sort={sortUi}
      albumsById={albumsById}
    />
  );
}
