import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import { createCatalogService } from "@sonafrik/api/catalog";
import { createListenerService } from "@sonafrik/api/listener";
import { CoverImage } from "@/components/CoverImage";
import { FollowButton } from "@/features/shared/social/components/FollowButton";
import { TipButton } from "@/features/shared/components/TipButton";
import { AppearsOnSection } from "@/components/track/AppearsOnSection";
import { ArtistTrackList } from "@/features/listener/components/ArtistTrackList";
import { isValidContentName, filterValidTracks, filterValidAlbums } from "@/lib/content-filter";

type SortParam = "popular" | "recent" | "oldest";

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabasePublicClient();
  const listener = createListenerService(supabase);
  const artist = await listener.getPublicArtistProfile(id);
  if (!artist) return { title: "Artiste — SONAFRIK" };

  const description = artist.bio
    ? artist.bio.slice(0, 155)
    : `Écoutez ${artist.stage_name} en streaming sur SONAFRIK.`;

  return {
    title: `${artist.stage_name} — SONAFRIK`,
    description,
    openGraph: {
      title: `${artist.stage_name} — SONAFRIK`,
      description,
      images: artist.cover_path ? [{ url: artist.cover_path }] : [],
    },
  };
}

export default async function ArtistPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const rawSort = Array.isArray(sp.sort) ? (sp.sort[0] ?? "recent") : (sp.sort ?? "recent");
  const sort: SortParam = ["popular", "recent", "oldest"].includes(rawSort)
    ? (rawSort as SortParam)
    : "recent";

  const supabase = getSupabasePublicClient();
  const listener = createListenerService(supabase);
  const catalog = createCatalogService(supabase);

  const artist = await listener.getPublicArtistProfile(id);
  if (!artist || !isValidContentName(artist.stage_name)) notFound();

  const [albums, tipsEnabled, appearances, stats] = await Promise.all([
    listener.getPublishedAlbumsForArtist(id, 12),
    listener.isFeatureEnabled("tips"),
    catalog.getTracksFeaturingCreator(id),
    listener.getArtistPublicStats(id),
  ]);

  const validAlbums = filterValidAlbums(albums);
  const albumCoverMap = new Map(validAlbums.map((a) => [a.id, a.cover_url]));

  const [pinnedTracks, allTracks] = await Promise.all([
    listener.getPinnedTracksForArtist(id, artist.stage_name, albumCoverMap),
    listener.getPublishedTracksForArtistSorted(id, artist.stage_name, albumCoverMap, sort, 30),
  ]);

  const validPinned = filterValidTracks(pinnedTracks);
  const validTracks = filterValidTracks(allTracks);

  return (
    <div className="ap-page">
      {/* Back nav */}
      <div className="ap-back">
        <Link href="/listen" className="ap-back-link">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L3 7l6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </Link>
      </div>

      {/* Banner */}
      {artist.banner_path ? (
        <div className="ap-banner ap-banner--img">
          <CoverImage coverPath={artist.banner_path} alt={artist.stage_name} priority imgSizes="100vw" />
        </div>
      ) : (
        <div className="ap-banner ap-banner--gradient" />
      )}

      <div className="ap-body">
        {/* Avatar */}
        <div className="ap-avatar-wrap">
          <div className="ap-avatar">
            {artist.cover_path ? (
              <CoverImage coverPath={artist.cover_path} alt={artist.stage_name} priority imgSizes="88px" />
            ) : (
              <span className="ap-avatar-initial" aria-hidden="true">
                {artist.stage_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Name + badge */}
        <div className="ap-name-row">
          <h1 className="ap-name">{artist.stage_name}</h1>
          {artist.verified && (
            <span className="ap-verified-badge">✓ Vérifié</span>
          )}
        </div>

        {/* Genres */}
        {artist.genres.length > 0 && (
          <p className="ap-genres">{artist.genres.join(" · ")}</p>
        )}

        {/* Social stats row */}
        <div className="ap-stats-row">
          <div className="ap-stat">
            <span className="ap-stat-value">{fmtCount(stats.total_streams)}</span>
            <span className="ap-stat-label">Écoutes</span>
          </div>
          <div className="ap-stat-sep" aria-hidden="true" />
          <div className="ap-stat">
            <span className="ap-stat-value">{fmtCount(stats.follower_count)}</span>
            <span className="ap-stat-label">Followers</span>
          </div>
          <div className="ap-stat-sep" aria-hidden="true" />
          <div className="ap-stat">
            <span className="ap-stat-value">{fmtCount(stats.track_count)}</span>
            <span className="ap-stat-label">Morceaux</span>
          </div>
        </div>

        {/* Follow + Support */}
        <div className="ap-actions">
          <FollowButton entityType="artist" entityId={artist.creator_id} />
          {tipsEnabled && (
            <TipButton creatorId={artist.creator_id} artistName={artist.stage_name} />
          )}
        </div>

        {/* Bio */}
        {artist.bio && (
          <p className="ap-bio">{artist.bio}</p>
        )}

        {/* Albums */}
        {validAlbums.length > 0 && (
          <section className="ap-section">
            <h2 className="ap-section-title">Sorties</h2>
            <div className="ap-albums-scroll">
              {validAlbums.map((album) => (
                <Link key={album.id} href={`/listen/album/${album.id}`} className="ap-album-card">
                  <div className="ap-album-cover">
                    <CoverImage
                      coverPath={album.cover_url}
                      alt={album.title}
                      gradientSeed={album.id.charCodeAt(0)}
                      imgSizes="112px"
                    />
                  </div>
                  <p className="ap-album-title">{album.title}</p>
                  <p className="ap-album-type">
                    {album.release_type === "single" ? "Single" : album.release_type === "ep" ? "EP" : "Album"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Pinned tracks */}
        {validPinned.length > 0 && (
          <section className="ap-section">
            <h2 className="ap-section-title">
              <span className="ap-pin-icon" aria-hidden="true">📌</span> Épinglés
            </h2>
            <ArtistTrackList tracks={validPinned} showPlayCount />
          </section>
        )}

        {/* All tracks with sort */}
        {validTracks.length > 0 && (
          <section className="ap-section">
            <div className="ap-tracks-header">
              <h2 className="ap-section-title">Catalogue</h2>
              <div className="ap-sort-tabs" role="group" aria-label="Trier par">
                <Link
                  href={`?sort=popular`}
                  className={`ap-sort-tab${sort === "popular" ? " ap-sort-tab--active" : ""}`}
                  replace
                >
                  Populaires
                </Link>
                <Link
                  href={`?sort=recent`}
                  className={`ap-sort-tab${sort === "recent" ? " ap-sort-tab--active" : ""}`}
                  replace
                >
                  Récents
                </Link>
                <Link
                  href={`?sort=oldest`}
                  className={`ap-sort-tab${sort === "oldest" ? " ap-sort-tab--active" : ""}`}
                  replace
                >
                  Plus anciens
                </Link>
              </div>
            </div>
            <ArtistTrackList tracks={validTracks} showPlayCount />
          </section>
        )}

        <AppearsOnSection appearances={appearances} />

        {validAlbums.length === 0 && validTracks.length === 0 && !appearances.length && (
          <div className="ap-empty">
            <p>Aucune musique publiée pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
