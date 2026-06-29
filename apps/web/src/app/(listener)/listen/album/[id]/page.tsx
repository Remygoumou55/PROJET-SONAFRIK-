import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createListenerService } from "@sonafrik/api/listener";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import { CoverImage } from "@/components/CoverImage";
import { formatDate } from "@/lib/formatters";
import { AlbumTracksClient } from "@/features/listener/components/AlbumTracksClient";
import { TrackCredits } from "@/components/track/TrackCredits";
import type { TrackCredit, TrackWithMeta } from "@sonafrik/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabasePublicClient();
  const listener = createListenerService(supabase);
  const meta = await listener.getPublishedAlbumMeta(id);
  if (!meta) return { title: "Album — SONAFRIK" };
  const artist = meta.artistName;
  return {
    title: artist ? `${meta.title} — ${artist} | SONAFRIK` : `${meta.title} — SONAFRIK`,
  };
}

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabasePublicClient();
  const listener = createListenerService(supabase);

  const album = await listener.getPublishedAlbumDetail(id);
  if (!album) notFound();

  const artistName = album.artist_name;
  const artistId = album.artist_creator_id || album.creator_id || null;

  const tracks: TrackWithMeta[] = await listener.getPublishedAlbumTracks(
    id,
    artistName,
    album.cover_url,
  );

  const trackIds = tracks.map((t) => t.id);
  const allCredits: TrackCredit[] = trackIds.length
    ? await listener.getTrackCreditsForTracks(trackIds)
    : [];

  const creditsByTrack = allCredits.reduce<Record<string, TrackCredit[]>>((acc, c) => {
    (acc[c.track_id] ??= []).push(c);
    return acc;
  }, {});

  const releaseLabel =
    album.release_type === "single" ? "Single"
    : album.release_type === "ep" ? "EP"
    : "Album";

  return (
    <div className="p-6 max-w-3xl">
      <Link
        href="/listen"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: "var(--color-texte-secondaire)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L3 7l6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Retour
      </Link>

      <div className="flex gap-5 mb-8">
        <div className="w-36 h-36 rounded-xl flex-shrink-0 overflow-hidden">
          <CoverImage
            coverPath={album.cover_url}
            alt={album.title}
            gradientSeed={0}
            priority
            imgSizes="144px"
          />
        </div>
        <div className="flex flex-col justify-end min-w-0">
          <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--color-texte-secondaire)" }}>
            {releaseLabel}
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-texte-principal)" }}>
            {album.title}
          </h1>
          {artistName && artistId && (
            <Link
              href={`/listen/artist/${artistId}`}
              className="text-sm mt-1 hover:underline"
              style={{ color: "var(--color-texte-secondaire)" }}
            >
              {artistName}
            </Link>
          )}
          {artistName && !artistId && (
            <p className="text-sm mt-1" style={{ color: "var(--color-texte-secondaire)" }}>
              {artistName}
            </p>
          )}
          {album.release_date && (
            <p className="text-xs mt-1" style={{ color: "var(--color-texte-desactive)" }}>
              {formatDate(album.release_date)}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: "var(--color-texte-desactive)" }}>
            {tracks.length} morceau{tracks.length !== 1 ? "x" : ""}
          </p>
        </div>
      </div>

      {album.description && (
        <p className="text-sm mb-6" style={{ color: "var(--color-texte-secondaire)" }}>
          {album.description}
        </p>
      )}

      {tracks.length === 0 ? (
        <div className="py-10 text-center rounded-xl" style={{ backgroundColor: "var(--color-card)" }}>
          <p className="text-sm" style={{ color: "var(--color-texte-desactive)" }}>
            Aucun morceau disponible pour cet album.
          </p>
        </div>
      ) : (
        <AlbumTracksClient tracks={tracks} />
      )}

      {tracks.some((t) => (creditsByTrack[t.id]?.length ?? 0) > 0) && (
        <div className="mt-8 space-y-5">
          {tracks.map((track) => {
            const trackCredits = creditsByTrack[track.id] ?? [];
            if (!trackCredits.length) return null;
            return (
              <div key={track.id}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-texte-desactive)" }}>
                  {track.title}
                </p>
                <TrackCredits credits={trackCredits} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
