import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createStreamingService } from "@sonafrik/api/streaming";
import { PlaylistDetail } from "@/features/streaming/components/PlaylistDetail";

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const streaming = createStreamingService(supabase);

  const playlist = await streaming.getPlaylist(id).catch(() => null);
  if (!playlist) notFound();

  return (
    <div className="p-6 max-w-2xl">
      <PlaylistDetail playlist={playlist} />
    </div>
  );
}
