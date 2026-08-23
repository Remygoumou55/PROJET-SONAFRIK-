import Link from "next/link";
import dynamic from "next/dynamic";
import type { DiscoveryArtist, DiscoveryTrack, HeroItemAlbum, TrendingTrack } from "@sonafrik/types";
import { CARD_GRADIENTS } from "@/lib/constants";
import { MediaCard } from "./HomepageMediaCard";
import { ListenDiscoverModeSlot } from "./ListenDiscoverModeSlot";

const TopGuineaSection = dynamic(
  () => import("./TopGuineaSection").then((m) => ({ default: m.TopGuineaSection })),
  { loading: () => <SectionRowSkeleton /> },
);

const ArtistsDiscoverSection = dynamic(
  () => import("./ArtistsDiscoverSection").then((m) => ({ default: m.ArtistsDiscoverSection })),
  { loading: () => <SectionRowSkeleton /> },
);

const HomepageDiscoverySection = dynamic(
  () => import("./HomepageDiscoverySection").then((m) => ({ default: m.HomepageDiscoverySection })),
  { loading: () => <SectionRowSkeleton /> },
);

const StartListeningBanner = dynamic(
  () => import("./StartListeningBanner").then((m) => ({ default: m.StartListeningBanner })),
);

function SectionRowSkeleton() {
  return (
    <div className="listen-page-section mt-8 px-6">
      <div className="h-5 w-40 rounded animate-pulse mb-4" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="flex gap-3 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-32 h-32 rounded-2xl flex-shrink-0 animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
        ))}
      </div>
    </div>
  );
}

import { ERROR_BANNER_STYLE, GENRE_CHIP_COLORS, HOMEPAGE_SECTION_STYLES } from "@/lib/design/overlayTokens";
import { CoverImage } from "@/components/CoverImage";

export interface HomepageData {
  playlists: Array<{ id: string; title: string; track_count: number }>;
  artists: Array<{ creator_id: string; stage_name: string; genres: string[] }>;
  genres: Array<{ id: string; name: string }>;
  discoveryTracks: DiscoveryTrack[];
  topGuineaTracks: TrendingTrack[];
  topGuineaPeriodLabel?: string;
  discoveries: DiscoveryTrack[];
  suggestedArtists: DiscoveryArtist[];
  featuredAlbums: HeroItemAlbum[];
  hadError: boolean;
}

function SectionEmptyHint({ label }: { label: string }) {
  return (
    <div className="mt-8 px-6">
      <p className="text-[11px] italic" style={{ color: "var(--color-elevated)" }}>
        {label} — Pas encore de contenu dans cette catégorie
      </p>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="pb-8 mt-8 space-y-10">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="px-6 space-y-3">
          <div className="h-4 w-28 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 80}ms` }} />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="w-32 h-32 rounded-2xl flex-shrink-0 animate-pulse" style={{ backgroundColor: "var(--color-card)", animationDelay: `${(i * 4 + j) * 40}ms` }} />
            ))}
          </div>
        </div>
      ))}
      <div className="px-6 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse" style={{ animationDelay: `${240 + i * 60}ms` }}>
            <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: "var(--color-card)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "var(--color-card)" }} />
              <div className="h-2.5 w-1/2 rounded" style={{ backgroundColor: "var(--color-card)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ContentSkeleton };

function formatPlaylistTrackCount(count: number): string {
  return count <= 1 ? `${count} titre` : `${count} titres`;
}

function FeaturedAlbumCard({ album, index }: { album: HeroItemAlbum; index: number }) {
  const albumHref = `/listen/album/${album.album_id}`;
  const releaseTypeLabel =
    album.release_type === "ep" ? "EP" :
    album.release_type === "single" ? "Single" :
    "Album";

  return (
    <Link
      href={albumHref}
      className="album-card flex-shrink-0 flex flex-col gap-2 w-[7.5rem] group"
      aria-label={`${album.album_title} par ${album.stage_name}`}
    >
      <div className="w-[7.5rem] h-[7.5rem] rounded-xl overflow-hidden relative">
        <CoverImage
          coverPath={album.cover_path}
          alt=""
          artistName={album.stage_name}
          gradientSeed={index + 300}
          imgSizes="120px"
        />
        <span className="absolute top-1.5 left-1.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
          style={{ background: "rgb(0 0 0 / 0.6)", color: "var(--color-vert-energie)", border: "1px solid rgb(246 192 9 / 0.3)" }}>
          {releaseTypeLabel}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-[12px] font-bold leading-tight truncate" style={{ color: "var(--color-texte-principal)" }}>
          {album.album_title}
        </p>
        <p className="text-[10px] leading-tight truncate" style={{ color: "var(--color-texte-subtil)" }}>
          {album.stage_name}
        </p>
      </div>
    </Link>
  );
}

export function HomepageContentSections({ content }: { content: HomepageData }) {
  const {
    playlists,
    artists,
    genres,
    topGuineaTracks,
    discoveries,
    suggestedArtists,
    featuredAlbums,
    hadError,
  } = content;

  const hasMusicContent =
    topGuineaTracks.length > 0 ||
    playlists.length > 0 ||
    artists.length > 0 ||
    discoveries.length > 0 ||
    suggestedArtists.length > 0 ||
    featuredAlbums.length > 0;

  const hasContent = hasMusicContent || genres.length > 0;

  const filledCount = [
    topGuineaTracks.length > 0,
    playlists.length > 0,
    artists.length > 0,
    discoveries.length > 0,
    suggestedArtists.length > 0,
    featuredAlbums.length > 0,
    genres.length > 0,
  ].filter(Boolean).length;
  const showHints = filledCount < 2;

  return (
    <div className="pb-8">

      {hadError && (
        <div
          className="mx-6 mt-4 rounded-xl px-4 py-3 text-sm"
          style={ERROR_BANNER_STYLE}
          role="alert"
        >
          Contenu temporairement indisponible. Réessayez dans quelques instants.
        </div>
      )}

      {!hadError && !hasMusicContent && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={HOMEPAGE_SECTION_STYLES.emptyIcon}>
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <path d="M9 18V5l12-2v13" stroke="var(--color-vert-energie)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" fill="var(--color-vert-energie)" opacity="0.7" />
              <circle cx="18" cy="16" r="3" fill="var(--color-vert-energie)" opacity="0.4" />
            </svg>
          </div>
          <p className="text-xl font-extrabold mb-2" style={{ color: "var(--color-texte-principal)" }}>La musique arrive bientôt</p>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--color-texte-subtil)" }}>
            Les artistes guinéens rejoignent SONAFRIK. En attendant, explorez et recherchez votre musique préférée.
          </p>
          <Link href="/search" className="mt-6 px-6 py-3 rounded-2xl text-sm font-black" style={{ background: "var(--color-vert-energie)", color: "black", ...HOMEPAGE_SECTION_STYLES.ctaGlow }}>
            Explorer la musique
          </Link>
        </div>
      )}

      <ListenDiscoverModeSlot />

      {/* 🔥 TOP GUINÉE */}
      {topGuineaTracks.length > 0 ? (
        <TopGuineaSection tracks={topGuineaTracks} periodLabel={content.topGuineaPeriodLabel} />
      ) : null}

      {/* 🎤 ARTISTES À DÉCOUVRIR */}
      <ArtistsDiscoverSection suggestedArtists={suggestedArtists} curatedArtists={artists} />

      {/* 💿 NOUVEAUX ALBUMS */}
      {featuredAlbums.length > 0 && (
        <section className="mt-8" aria-label="Nouveaux albums">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgb(139 92 246 / 0.15)", border: "1px solid rgb(139 92 246 / 0.2)" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-violet)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>
                💿 Nouveaux albums
              </h2>
            </div>
            <Link
              href="/search"
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "var(--color-surface)", color: "var(--color-vert-energie)", border: "1px solid var(--color-elevated)" }}
            >
              Voir tout →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: "none" }}>
            {featuredAlbums.map((album, i) => (
              <FeaturedAlbumCard key={album.album_id} album={album} index={i} />
            ))}
          </div>
        </section>
      )}
      {featuredAlbums.length === 0 && hasContent && showHints && <SectionEmptyHint label="Nouveaux albums" />}

      {/* 🔍 À DÉCOUVRIR MAINTENANT */}
      {discoveries.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={HOMEPAGE_SECTION_STYLES.pourToiIcon}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>🔍 À découvrir</h2>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={HOMEPAGE_SECTION_STYLES.pourToiPill}>Pour toi</span>
          </div>
          <HomepageDiscoverySection tracks={discoveries} />
        </section>
      )}
      {discoveries.length === 0 && hasContent && showHints && <SectionEmptyHint label="Découvertes" />}

      {/* 🎵 PLAYLISTS */}
      {playlists.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={HOMEPAGE_SECTION_STYLES.forYouIcon}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--color-or-solaire)" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>🎵 Playlists</h2>
            </div>
            <Link href="/library" className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--color-surface)", color: "var(--color-vert-energie)", border: "1px solid var(--color-elevated)" }}>
              Voir tout →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: "none" }}>
            {playlists.map((pl, i) => {
              const grad = CARD_GRADIENTS[i % CARD_GRADIENTS.length]!;
              return (
                <MediaCard
                  key={pl.id}
                  title={pl.title}
                  subtitle={pl.track_count > 0 ? formatPlaylistTrackCount(pl.track_count) : "Playlist"}
                  gradient={grad}
                  href={`/library/playlist/${pl.id}`}
                />
              );
            })}
          </div>
        </section>
      )}
      {playlists.length === 0 && hasContent && showHints && <SectionEmptyHint label="Playlists" />}

      {/* 🎶 GENRES */}
      {genres.length > 0 && (
        <section className="mt-8 px-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={HOMEPAGE_SECTION_STYLES.genresIcon}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="var(--color-accent-rose)">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>🎶 Genres</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre, i) => {
              const c = GENRE_CHIP_COLORS[i % GENRE_CHIP_COLORS.length]!;
              return (
                <Link key={genre.id} href={`/search?genre=${encodeURIComponent(genre.name)}`}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-opacity hover:opacity-80"
                  style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                  {genre.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}
      {genres.length === 0 && hasContent && showHints && <SectionEmptyHint label="Genres" />}

      <StartListeningBanner />

    </div>
  );
}
