import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createStreamingService } from "@sonafrik/api/streaming";
import { createListenerService } from "@sonafrik/api/listener";
import { PlaylistDetail } from "@/features/listener/components/PlaylistDetail";
import type { TrackWithMeta } from "@sonafrik/types";

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const streaming = createStreamingService(supabase);
  const listener = createListenerService(supabase);

  const [playlist, { data: { user } }] = await Promise.all([
    streaming.getPlaylist(id).catch(() => null),
    supabase.auth.getUser(),
  ]);
  if (!playlist) notFound();

  const rawTracks = await listener.getPlaylistTracksForPage(id);

  const initialTracks: TrackWithMeta[] = rawTracks.map((pt) => ({
    id: pt.track_id,
    title: pt.track?.title ?? "Morceau",
    duration_seconds: pt.track?.duration_seconds ?? null,
    creator_id: pt.track?.creator_id ?? "",
    album_id: pt.track?.album_id ?? null,
    slug: "",
    track_number: pt.position,
    isrc: null,
    explicit: false,
    language: "fr",
    bpm: null,
    musical_key: null,
    publication_status: "published" as const,
    rejection_reason: null,
    submitted_at: null,
    published_at: null,
    metadata: {},
    created_at: pt.added_at,
    updated_at: pt.added_at,
    deleted_at: null,
    cover_url: null,
    artist_name: undefined,
  }));

  return (
    <div className="p-6 max-w-2xl">
      <PlaylistDetail playlist={playlist} initialTracks={initialTracks} currentUserId={user?.id} />
    </div>
  );
}
