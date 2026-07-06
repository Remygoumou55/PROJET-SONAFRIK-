"use client";

import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import { FollowButton } from "@/features/shared/social/components/FollowButton";
import { TipButton } from "@/features/shared/components/TipButton";
import { AppearsOnSection } from "@/components/track/AppearsOnSection";
import { ArtistTrackList } from "@/features/listener/components/ArtistTrackList";
import { useArtistPublicSrtspLive } from "../hooks/useArtistPublicSrtspLive";
import type { ArtistPublicPageData, ArtistPublicSort } from "../lib/fetchArtistPublicPageData";

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function ArtistPublicPageClient({
  artistId,
  sort,
  initialData,
}: {
  artistId: string;
  sort: ArtistPublicSort;
  initialData: ArtistPublicPageData;
}) {
  const { data: liveData } = useArtistPublicSrtspLive({
    artistId,
    creatorId: initialData.artist.creator_id,
    sort,
    initialData,
  });

  const page = liveData ?? initialData;
  const { artist, validAlbums, validPinned, validTracks, appearances, stats, tipsEnabled } = page;

  return (
    <div className="ap-page">
      <div className="ap-back">
        <Link href="/listen" className="ap-back-link">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L3 7l6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </Link>
      </div>

      {artist.banner_path ? (
        <div className="ap-banner ap-banner--img">
          <CoverImage coverPath={artist.banner_path} alt={artist.stage_name} priority imgSizes="100vw" />
        </div>
      ) : (
        <div className="ap-banner ap-banner--gradient" />
      )}

      <div className="ap-body">
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

        <div className="ap-name-row">
          <h1 className="ap-name">{artist.stage_name}</h1>
          {artist.verified ? <span className="ap-verified-badge">✓ Vérifié</span> : null}
        </div>

        {artist.genres.length > 0 ? <p className="ap-genres">{artist.genres.join(" · ")}</p> : null}

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

        <div className="ap-actions">
          <FollowButton entityType="artist" entityId={artist.creator_id} />
          {tipsEnabled ? (
            <TipButton creatorId={artist.creator_id} artistName={artist.stage_name} />
          ) : null}
        </div>

        {artist.bio ? <p className="ap-bio">{artist.bio}</p> : null}

        {validAlbums.length > 0 ? (
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
        ) : null}

        {validPinned.length > 0 ? (
          <section className="ap-section">
            <h2 className="ap-section-title">
              <span className="ap-pin-icon" aria-hidden="true">📌</span> Épinglés
            </h2>
            <ArtistTrackList tracks={validPinned} showPlayCount />
          </section>
        ) : null}

        {validTracks.length > 0 ? (
          <section className="ap-section">
            <div className="ap-tracks-header">
              <h2 className="ap-section-title">Catalogue</h2>
              <div className="ap-sort-tabs" role="group" aria-label="Trier par">
                <Link
                  href="?sort=popular"
                  className={`ap-sort-tab${sort === "popular" ? " ap-sort-tab--active" : ""}`}
                  replace
                >
                  Populaires
                </Link>
                <Link
                  href="?sort=recent"
                  className={`ap-sort-tab${sort === "recent" ? " ap-sort-tab--active" : ""}`}
                  replace
                >
                  Récents
                </Link>
                <Link
                  href="?sort=oldest"
                  className={`ap-sort-tab${sort === "oldest" ? " ap-sort-tab--active" : ""}`}
                  replace
                >
                  Plus anciens
                </Link>
              </div>
            </div>
            <ArtistTrackList tracks={validTracks} showPlayCount />
          </section>
        ) : null}

        <AppearsOnSection appearances={appearances} />

        {validAlbums.length === 0 && validTracks.length === 0 && !appearances.length ? (
          <div className="ap-empty">
            <p>Aucune musique publiée pour le moment.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
