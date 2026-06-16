import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createStreamingService } from "@sonafrik/api/streaming";
import { PlaylistDetail } from "@/features/streaming/components/PlaylistDetail";
import type { TrackWithMeta } from "@sonafrik/types";

interface PlaylistTrackRow {
  track_id: string;
  position: number;
  added_at: string;
  added_by: string | null;
  track: {
    id: string;
    title: string;
    duration_seconds: number | null;
    creator_id: string;
    album_id: string | null;
  } | null;
}

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

  const { data: rawTracks } = await supabase
    .from("playlist_tracks")
    .select("track_id, position, added_at, added_by, track:tracks(id, title, duration_seconds, creator_id, album_id)")
    .eq("playlist_id", id)
    .order("position");

  const initialTracks: TrackWithMeta[] = ((rawTracks ?? []) as unknown as PlaylistTrackRow[]).map((pt) => ({
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
      <PlaylistDetail playlist={playlist} initialTracks={initialTracks} />
    </div>
  );
}
