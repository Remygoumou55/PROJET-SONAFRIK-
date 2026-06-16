import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CoverImage } from "@/components/CoverImage";
import { formatDate } from "@/lib/formatters";
import { AlbumTracksClient } from "@/features/streaming/components/AlbumTracksClient";
import type { TrackWithMeta } from "@sonafrik/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("albums")
    .select("title, artist_profiles(stage_name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { title: "Album — SONAFRIK" };
  const ap = (data as unknown as { artist_profiles: { stage_name: string } | null }).artist_profiles;
  const artist = ap?.stage_name;
  return {
    title: artist ? `${data.title} — ${artist} | SONAFRIK` : `${data.title} — SONAFRIK`,
  };
}

interface AlbumRow {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  release_type: string;
  release_date: string | null;
  artist_profiles: { stage_name: string } | null;
}

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: albumRaw } = await supabase
    .from("albums")
    .select("id, title, description, cover_url, release_type, release_date, artist_profiles(stage_name)")
    .eq("id", id)
    .eq("publication_status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (!albumRaw) notFound();

  const album = albumRaw as unknown as AlbumRow;
  const artistName = album.artist_profiles?.stage_name ?? null;

  const { data: rawTracks } = await supabase
    .from("tracks")
    .select("id, title, duration_seconds, track_number, creator_id, publication_status")
    .eq("album_id", id)
    .eq("publication_status", "published")
    .is("deleted_at", null)
    .order("track_number", { ascending: true });

  const tracks: TrackWithMeta[] = (rawTracks ?? []).map((t) => ({
    ...(t as unknown as TrackWithMeta),
    artist_name: artistName ?? undefined,
    cover_url: album.cover_url,
  }));

  const releaseLabel =
    album.release_type === "single" ? "Single"
    : album.release_type === "ep" ? "EP"
    : "Album";

  return (
    <div className="p-6 max-w-3xl">
      {/* Retour */}
      <Link
        href="/listen"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: "#A0A0A0" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L3 7l6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Retour
      </Link>

      {/* En-tête album */}
      <div className="flex gap-5 mb-8">
        <div className="w-36 h-36 rounded-xl flex-shrink-0 overflow-hidden">
          <CoverImage
            coverPath={album.cover_url}
            alt={album.title}
            gradientSeed={0}
            priority
          />
        </div>
        <div className="flex flex-col justify-end min-w-0">
          <p className="text-xs font-semibold uppercase mb-1" style={{ color: "#A0A0A0" }}>
            {releaseLabel}
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
            {album.title}
          </h1>
          {artistName && (
            <p className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
              {artistName}
            </p>
          )}
          {album.release_date && (
            <p className="text-xs mt-1" style={{ color: "#555555" }}>
              {formatDate(album.release_date)}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: "#555555" }}>
            {tracks.length} morceau{tracks.length !== 1 ? "x" : ""}
          </p>
        </div>
      </div>

      {/* Description */}
      {album.description && (
        <p className="text-sm mb-6" style={{ color: "#A0A0A0" }}>
          {album.description}
        </p>
      )}

      {/* Liste morceaux */}
      {tracks.length === 0 ? (
        <div className="py-10 text-center rounded-xl" style={{ backgroundColor: "#1F1F1F" }}>
          <p className="text-sm" style={{ color: "#555555" }}>
            Aucun morceau disponible pour cet album.
          </p>
        </div>
      ) : (
        <AlbumTracksClient tracks={tracks} />
      )}
    </div>
  );
}
