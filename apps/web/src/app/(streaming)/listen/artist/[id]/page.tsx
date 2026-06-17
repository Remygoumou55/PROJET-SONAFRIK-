import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CoverImage } from "@/components/CoverImage";
import { AlbumTracksClient } from "@/features/streaming/components/AlbumTracksClient";
import { FollowButton } from "@/features/social/components/FollowButton";
import { TipButton } from "@/features/marketplace/components/TipButton";
import type { TrackWithMeta } from "@sonafrik/types";

interface ArtistRow {
  creator_id: string;
  stage_name: string;
  bio: string | null;
  genres: string[];
  cover_path: string | null;
  banner_path: string | null;
  verified: boolean;
  is_public: boolean;
}

interface AlbumRow {
  id: string;
  title: string;
  release_type: string;
  cover_url: string | null;
  release_date: string | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("artist_profiles")
    .select("stage_name")
    .eq("creator_id", id)
    .eq("is_public", true)
    .maybeSingle();
  return { title: data ? `${data.stage_name} — SONAFRIK` : "Artiste — SONAFRIK" };
}

export default async function ArtistPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: artistRaw } = await supabase
    .from("artist_profiles")
    .select("creator_id, stage_name, bio, genres, cover_path, banner_path, verified, is_public")
    .eq("creator_id", id)
    .eq("is_public", true)
    .maybeSingle();

  if (!artistRaw) notFound();
  const artist = artistRaw as unknown as ArtistRow;

  // Feature flag tips — SQL RLS : voir apps/web/src/lib/sql/feature_flags.sql
  const { data: tipFlagRow } = await supabase
    .from("feature_flags" as never)
    .select("enabled")
    .eq("name" as never, "tips")
    .maybeSingle();
  const tipsEnabled = (tipFlagRow as { enabled: boolean } | null)?.enabled ?? false;

  const [albumsRes, tracksRes] = await Promise.all([
    supabase
      .from("albums")
      .select("id, title, release_type, cover_url, release_date")
      .eq("creator_id", id)
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .order("release_date", { ascending: false })
      .limit(12),
    supabase
      .from("tracks")
      .select("id, title, duration_seconds, track_number, creator_id, publication_status, album_id")
      .eq("creator_id", id)
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(10),
  ]);

  const albums = (albumsRes.data ?? []) as unknown as AlbumRow[];
  const albumCoverMap = new Map(albums.map((a) => [a.id, a.cover_url]));
  const tracks: TrackWithMeta[] = (tracksRes.data ?? []).map((t) => ({
    ...(t as unknown as TrackWithMeta),
    artist_name: artist.stage_name,
    cover_url: albumCoverMap.get((t as unknown as { album_id?: string }).album_id ?? "") ?? null,
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0D0D0D" }}>
      {/* Lien retour */}
      <div className="px-6 pt-5">
        <Link
          href="/listen"
          className="inline-flex items-center gap-1.5 text-sm"
          style={{ color: "#A0A0A0" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L3 7l6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </Link>
      </div>

      {/* Banner */}
      {artist.banner_path ? (
        <div className="mt-3 h-32 w-full overflow-hidden" style={{ backgroundColor: "#1F1F1F" }}>
          <CoverImage coverPath={artist.banner_path} alt={artist.stage_name} priority />
        </div>
      ) : (
        <div className="mt-3 h-24" style={{ background: "linear-gradient(135deg, #00D26A22 0%, #FFC20E11 100%)" }} />
      )}

      {/* Header artiste */}
      <div className="px-6 pb-8">
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full -mt-10 mb-3 overflow-hidden border-2 relative"
          style={{ borderColor: "#0D0D0D", backgroundColor: "#2A2A2A" }}
        >
          {artist.cover_path ? (
            <CoverImage coverPath={artist.cover_path} alt={artist.stage_name} priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: "#00D26A" }}>
              {artist.stage_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-xl font-bold" style={{ color: "#FFFFFF" }}>
            {artist.stage_name}
          </h1>
          {artist.verified && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: "#FFC20E22", color: "#FFC20E" }}
            >
              ✓ Vérifié
            </span>
          )}
        </div>

        {artist.genres.length > 0 && (
          <p className="text-sm mb-2" style={{ color: "#A0A0A0" }}>
            {artist.genres.join(" · ")}
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FollowButton entityType="artist" entityId={artist.creator_id} showCount />
          {tipsEnabled ? (
            <TipButton receiverCreatorId={artist.creator_id} recipientName={artist.stage_name} />
          ) : null}
        </div>

        {artist.bio && (
          <p className="text-sm leading-relaxed max-w-xl mb-6" style={{ color: "#A0A0A0" }}>
            {artist.bio}
          </p>
        )}

        {/* Albums */}
        {albums.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "#555555" }}>
              Sorties
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/listen/album/${album.id}`}
                  className="flex-shrink-0 w-28 group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-2 relative" style={{ backgroundColor: "#1F1F1F" }}>
                    <CoverImage coverPath={album.cover_url} alt={album.title} gradientSeed={album.id.charCodeAt(0)} />
                  </div>
                  <p className="text-xs font-medium truncate group-hover:underline" style={{ color: "#FFFFFF" }}>
                    {album.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#555555" }}>
                    {album.release_type === "single" ? "Single" : album.release_type === "ep" ? "EP" : "Album"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Morceaux populaires */}
        {tracks.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "#555555" }}>
              Morceaux
            </h2>
            <AlbumTracksClient tracks={tracks} />
          </section>
        )}

        {albums.length === 0 && tracks.length === 0 && (
          <div className="py-10 text-center rounded-xl" style={{ backgroundColor: "#1F1F1F" }}>
            <p className="text-sm" style={{ color: "#555555" }}>
              Aucune musique publiée pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
