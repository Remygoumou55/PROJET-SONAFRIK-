import { notFound } from "next/navigation";
import { createCatalogService } from "@sonafrik/api/catalog";
import { TrackView } from "@/features/creator/catalog/components/TrackView";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ViewTrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;
  await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);

  let track;
  try {
    track = await catalog.getTrack(trackId);
  } catch {
    notFound();
  }

  if (!track) notFound();

  const [album, genreIds, genres] = await Promise.all([
    track.album_id ? catalog.getAlbum(track.album_id).catch(() => null) : Promise.resolve(null),
    catalog.getTrackGenreIds(trackId).catch(() => [] as string[]),
    catalog.getGenres().catch(() => []),
  ]);

  const genreName = genres.find((g) => g.id === genreIds[0])?.name ?? null;

  return <TrackView track={track} album={album} genreName={genreName} />;
}
