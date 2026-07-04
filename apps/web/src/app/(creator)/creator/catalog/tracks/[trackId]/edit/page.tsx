import { notFound, redirect } from "next/navigation";
import { createCatalogService } from "@sonafrik/api/catalog";
import { TrackEditor } from "@/features/creator/catalog/components/TrackEditor";
import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;
  const context = await requireCreatorContext();
  const supabase = await getSupabaseServerClient();
  const catalog = createCatalogService(supabase);

  let track;
  let initialGenreId = "";
  try {
    track = await catalog.getTrack(trackId);
    if (track) {
      const genreIds = await catalog.getTrackGenreIds(trackId);
      initialGenreId = genreIds[0] ?? "";
    }
  } catch {
    notFound();
  }

  if (track.publication_status !== "draft" && track.publication_status !== "rejected") {
    redirect("/creator/catalog/tracks");
  }

  return (
    <TrackEditor
      track={track}
      creatorId={context.creator.id}
      stageName={context.artistProfile.stage_name ?? "Artiste"}
      initialGenreId={initialGenreId}
    />
  );
}
