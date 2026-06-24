import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createCatalogService } from "@sonafrik/api/catalog";
import { createListenerService } from "@sonafrik/api/listener";
import { CoverImage } from "@/components/CoverImage";
import { AlbumTracksClient } from "@/features/listener/components/AlbumTracksClient";
import { AppearsOnSection } from "@/components/track/AppearsOnSection";
import { FollowButton } from "@/features/social/components/FollowButton";
import { TipButton } from "@/features/shared/components/TipButton";
import type { TrackWithMeta } from "@sonafrik/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const listener = createListenerService(supabase);
  const artist = await listener.getPublicArtistProfile(id);
  return { title: artist ? `${artist.stage_name} — SONAFRIK` : "Artiste — SONAFRIK" };
}

export default async function ArtistPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const listener = createListenerService(supabase);
  const catalog = createCatalogService(supabase);

  const artist = await listener.getPublicArtistProfile(id);
  if (!artist) notFound();

  const [albums, tipsEnabled, appearances] = await Promise.all([
    listener.getPublishedAlbumsForArtist(id, 12),
    listener.isFeatureEnabled("tips"),
    catalog.getTracksFeaturingCreator(id),
  ]);

  const albumCoverMap = new Map(albums.map((a) => [a.id, a.cover_url]));
  const tracks: TrackWithMeta[] = await listener.getPublishedTracksForArtist(
    id,
    artist.stage_name,
    albumCoverMap,
    10,
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-noir-profond)" }}>
      <div className="px-6 pt-5">
        <Link
          href="/listen"
          className="inline-flex items-center gap-1.5 text-sm"
          style={{ color: "var(--color-texte-secondaire)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L3 7l6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </Link>
      </div>

      {artist.banner_path ? (
        <div className="mt-3 h-32 w-full overflow-hidden" style={{ backgroundColor: "var(--color-card)" }}>
          <CoverImage coverPath={artist.banner_path} alt={artist.stage_name} priority imgSizes="100vw" />
        </div>
      ) : (
        <div className="mt-3 h-24" style={{ background: "linear-gradient(135deg, rgba(0, 210, 106, 0.13) 0%, rgba(255, 194, 14, 0.07) 100%)" }} />
      )}

      <div className="px-6 pb-8">
        <div
          className="w-20 h-20 rounded-full -mt-10 mb-3 overflow-hidden border-2 relative"
          style={{ borderColor: "var(--color-noir-profond)", backgroundColor: "var(--color-elevated)" }}
        >
          {artist.cover_path ? (
            <CoverImage coverPath={artist.cover_path} alt={artist.stage_name} priority imgSizes="80px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: "var(--color-vert-energie)" }}>
              {artist.stage_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--color-texte-principal)" }}>
            {artist.stage_name}
          </h1>
          {artist.verified && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: "rgba(255, 194, 14, 0.13)", color: "var(--color-or-solaire)" }}
            >
              ✓ Vérifié
            </span>
          )}
        </div>

        {artist.genres.length > 0 && (
          <p className="text-sm mb-2" style={{ color: "var(--color-texte-secondaire)" }}>
            {artist.genres.join(" · ")}
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FollowButton entityType="artist" entityId={artist.creator_id} showCount />
          {tipsEnabled ? (
            <TipButton creatorId={artist.creator_id} artistName={artist.stage_name} />
          ) : null}
        </div>

        {artist.bio && (
          <p className="text-sm leading-relaxed max-w-xl mb-6" style={{ color: "var(--color-texte-secondaire)" }}>
            {artist.bio}
          </p>
        )}

        {albums.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--color-texte-desactive)" }}>
              Sorties
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/listen/album/${album.id}`}
                  className="flex-shrink-0 w-28 group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-2 relative" style={{ backgroundColor: "var(--color-card)" }}>
                    <CoverImage coverPath={album.cover_url} alt={album.title} gradientSeed={album.id.charCodeAt(0)} imgSizes="112px" />
                  </div>
                  <p className="text-xs font-medium truncate group-hover:underline" style={{ color: "var(--color-texte-principal)" }}>
                    {album.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--color-texte-desactive)" }}>
                    {album.release_type === "single" ? "Single" : album.release_type === "ep" ? "EP" : "Album"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {tracks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--color-texte-desactive)" }}>
              Morceaux
            </h2>
            <AlbumTracksClient tracks={tracks} />
          </section>
        )}

        <AppearsOnSection appearances={appearances} />

        {albums.length === 0 && tracks.length === 0 && !appearances.length && (
          <div className="py-10 text-center rounded-xl" style={{ backgroundColor: "var(--color-card)" }}>
            <p className="text-sm" style={{ color: "var(--color-texte-desactive)" }}>
              Aucune musique publiée pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
