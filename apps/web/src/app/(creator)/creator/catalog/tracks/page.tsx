import type { Metadata } from "next";
import {
  createCatalogService,
  normalizePublicationSort,
  parsePublicationLibraryQuery,
  shouldLoadPublicationInsight,
} from "@sonafrik/api/catalog";
import { PublicationsLibrary } from "@/features/creator/publications";
import { resolvePublicationsPageSize } from "@/features/creator/publications/lib/publicationsPageSize";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = resolvePublicationsPageSize();

const PAGE_TITLE = "Mes publications";
const PAGE_DESCRIPTION =
  "Gérez vos publications SONAFRIK, filtrez votre catalogue et suivez le statut, l'activite et les performances de chaque morceau.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    alternates: {
      canonical: "/creator/catalog/tracks",
    },
    openGraph: {
      title: `${PAGE_TITLE} — SONAFRIK`,
      description: PAGE_DESCRIPTION,
      url: "/creator/catalog/tracks",
      siteName: "SONAFRIK",
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${PAGE_TITLE} — SONAFRIK`,
      description: PAGE_DESCRIPTION,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

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
  const sortUi = sortParam === "title" || sortParam === "alpha" ? "alpha" : sortParam ?? "updated";

  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);
  let tracks: Awaited<ReturnType<typeof catalog.listTracksPage>>["tracks"] = [];
  let total = 0;
  let catalogTotal = 0;
  let albumsById: Record<string, Awaited<ReturnType<typeof catalog.listAlbumsByIds>>[number]> = {};
  let insights: Awaited<ReturnType<typeof catalog.getPublicationInsights>> = [];

  const libraryQuery = parsePublicationLibraryQuery({
    q: search,
    status,
    sort: sortUi,
    page,
    pageSize: PAGE_SIZE,
  });

  let loadError: string | null = null;

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
    try {
      const albums = albumIds.length > 0 ? await catalog.listAlbumsByIds(albumIds) : [];
      albumsById = Object.fromEntries(albums.map((album) => [album.id, album]));
    } catch {
      albumsById = {};
    }

    try {
      const insightTrackIds = tracks
        .filter((track) => shouldLoadPublicationInsight(track.publication_status))
        .map((track) => track.id);
      insights =
        insightTrackIds.length > 0 ? await catalog.getPublicationInsights(insightTrackIds) : [];
    } catch {
      insights = [];
    }
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Impossible de charger vos publications.";
    tracks = [];
    total = 0;
    catalogTotal = 0;
    albumsById = {};
    insights = [];
  }

  return (
    <PublicationsLibrary
      key={`pub-lib:${page}:${search}:${status}:${sortUi}`}
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
      insights={insights}
      loadError={loadError}
    />
  );
}
