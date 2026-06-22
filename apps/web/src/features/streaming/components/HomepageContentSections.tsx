import Link from "next/link";
import type { DiscoveryAlbum, DiscoveryArtist, DiscoveryTrack, TrendingTrack } from "@sonafrik/types";
import { CARD_GRADIENTS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { HomepageTrendingSection } from "./HomepageTrendingRow";
import { HomepageDiscoverySection } from "./HomepageDiscoverySection";
import { MediaCard } from "./HomepageMediaCard";

const ARTIST_RING_COLORS = [
  { color: "var(--color-vert-energie)",  bg: "rgba(0, 210, 106, 0.14)",  glow: "rgba(0, 210, 106, 0.06)",  ring: "rgba(0, 210, 106, 0.31)",  inner: "rgba(0, 210, 106, 0.20)" },
  { color: "var(--color-or-solaire)",    bg: "rgba(255, 194, 14, 0.14)", glow: "rgba(255, 194, 14, 0.06)", ring: "rgba(255, 194, 14, 0.31)", inner: "rgba(255, 194, 14, 0.20)" },
  { color: "var(--color-accent-violet)", bg: "rgba(168, 85, 247, 0.14)", glow: "rgba(168, 85, 247, 0.06)", ring: "rgba(168, 85, 247, 0.31)", inner: "rgba(168, 85, 247, 0.20)" },
  { color: "var(--color-info)",          bg: "rgba(59, 130, 246, 0.14)", glow: "rgba(59, 130, 246, 0.06)", ring: "rgba(59, 130, 246, 0.31)", inner: "rgba(59, 130, 246, 0.20)" },
  { color: "var(--color-accent-orange)", bg: "rgba(249, 115, 22, 0.14)", glow: "rgba(249, 115, 22, 0.06)", ring: "rgba(249, 115, 22, 0.31)", inner: "rgba(249, 115, 22, 0.20)" },
  { color: "var(--color-accent-rose)",   bg: "rgba(236, 72, 153, 0.14)", glow: "rgba(236, 72, 153, 0.06)", ring: "rgba(236, 72, 153, 0.31)", inner: "rgba(236, 72, 153, 0.20)" },
] as const;

export interface HomepageData {
  playlists: Array<{ id: string; title: string; track_count: number }>;
  artists: Array<{ creator_id: string; stage_name: string; genres: string[] }>;
  genres: Array<{ id: string; name: string }>;
  trending: TrendingTrack[];
  discoveries: DiscoveryTrack[];
  newAlbums: DiscoveryAlbum[];
  suggestedArtists: DiscoveryArtist[];
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

export function HomepageContentSections({ content }: { content: HomepageData }) {
  const { playlists, artists, genres, trending, discoveries, newAlbums, suggestedArtists, hadError } = content;

  const hasMusicContent =
    trending.length > 0 || playlists.length > 0 || artists.length > 0 ||
    discoveries.length > 0 || newAlbums.length > 0 || suggestedArtists.length > 0;

  const hasContent = hasMusicContent || genres.length > 0;

  const filledCount = [
    trending.length > 0, playlists.length > 0, artists.length > 0,
    discoveries.length > 0, newAlbums.length > 0, suggestedArtists.length > 0, genres.length > 0,
  ].filter(Boolean).length;
  const showHints = filledCount < 2;

  const GENRE_COLORS = [
    { bg: "rgba(0, 210, 106, 0.08)",  text: "var(--color-vert-energie)",  border: "rgba(0, 210, 106, 0.19)" },
    { bg: "rgba(255, 194, 14, 0.08)", text: "var(--color-or-solaire)",    border: "rgba(255, 194, 14, 0.19)" },
    { bg: "rgba(168, 85, 247, 0.08)", text: "var(--color-accent-violet)", border: "rgba(168, 85, 247, 0.19)" },
    { bg: "rgba(59, 130, 246, 0.08)", text: "var(--color-info)",          border: "rgba(59, 130, 246, 0.19)" },
    { bg: "rgba(249, 115, 22, 0.08)", text: "var(--color-accent-orange)", border: "rgba(249, 115, 22, 0.19)" },
    { bg: "rgba(236, 72, 153, 0.08)", text: "var(--color-accent-rose)",   border: "rgba(236, 72, 153, 0.19)" },
  ];

  return (
    <div className="pb-8">

      {hadError && (
        <div
          className="mx-6 mt-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(255, 68, 68, 0.09)", color: "var(--color-erreur)", border: "1px solid rgba(255, 68, 68, 0.20)" }}
          role="alert"
        >
          Contenu temporairement indisponible. Réessayez dans quelques instants.
        </div>
      )}

      {!hadError && !hasMusicContent && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, rgba(0, 210, 106, 0.10), rgba(0, 210, 106, 0.04))", border: "1px solid rgba(0, 210, 106, 0.19)" }}>
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
          <Link href="/search" className="mt-6 px-6 py-3 rounded-2xl text-sm font-black" style={{ background: "var(--color-vert-energie)", color: "black", boxShadow: "0 0 20px rgba(0,210,106,0.35)" }}>
            Explorer la musique
          </Link>
        </div>
      )}

      {/* TENDANCES */}
      {trending.length === 0 && hasContent && showHints && <SectionEmptyHint label="Tendances" />}
      {trending.length > 0 && (
        <section className="mt-8 mb-2">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0, 210, 106, 0.13), rgba(0, 210, 106, 0.07))", border: "1px solid rgba(0, 210, 106, 0.20)" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="var(--color-vert-energie)">
                  <path d="M22 7l-9 9-4-4-7 7" stroke="var(--color-vert-energie)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M16 7h6v6" stroke="var(--color-vert-energie)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>🇬🇳 Tendances en Guinée</h2>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0, 210, 106, 0.08)", color: "var(--color-vert-energie)", border: "1px solid rgba(0, 210, 106, 0.13)" }}>
              7 derniers jours
            </span>
          </div>
          <HomepageTrendingSection tracks={trending} />
        </section>
      )}

      {/* POUR VOUS */}
      {playlists.length === 0 && hasContent && showHints && <SectionEmptyHint label="Pour vous" />}
      {playlists.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 194, 14, 0.10)", border: "1px solid rgba(255, 194, 14, 0.20)" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--color-or-solaire)" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>🎯 Recommandé pour vous</h2>
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
                  subtitle={pl.track_count > 0 ? `${pl.track_count} titre${pl.track_count > 1 ? "s" : ""}` : "Playlist"}
                  gradient={grad}
                  href="/library"
                />
              );
            })}
          </div>
        </section>
      )}

      {/* TOP ARTISTES */}
      {artists.length === 0 && hasContent && showHints && <SectionEmptyHint label="Top artistes" />}
      {artists.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(168, 85, 247, 0.10)", border: "1px solid rgba(168, 85, 247, 0.20)" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-violet)" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>⭐ Artistes populaires</h2>
            </div>
            <Link href="/search" className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--color-surface)", color: "var(--color-vert-energie)", border: "1px solid var(--color-elevated)" }}>
              Voir tout →
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: "none" }}>
            {artists.map((artist, i) => {
              const c = ARTIST_RING_COLORS[i % ARTIST_RING_COLORS.length]!;
              const genre = (artist.genres as string[])[0] ?? "Artiste";
              return (
                <Link key={artist.creator_id} href="/search" className="flex-shrink-0 flex flex-col items-center gap-2 w-20 group">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-base relative transition-transform group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${c.bg}, ${c.glow})`, border: `2.5px solid ${c.ring}`, color: c.color }}>
                    {getInitials(artist.stage_name)}
                    <div className="absolute inset-0 rounded-full opacity-20" style={{ border: `1px solid ${c.inner}` }} />
                  </div>
                  <p className="text-[11px] text-center font-bold leading-tight" style={{ color: "var(--color-texte-principal)" }}>{artist.stage_name}</p>
                  <p className="text-[9px] text-center" style={{ color: "var(--color-texte-desactive)" }}>{genre}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* DÉCOUVERTES */}
      {discoveries.length === 0 && hasContent && showHints && <SectionEmptyHint label="Découvertes" />}
      {discoveries.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(59, 130, 246, 0.10)", border: "1px solid rgba(59, 130, 246, 0.20)" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>🔍 À découvrir maintenant</h2>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(59, 130, 246, 0.08)", color: "var(--color-info)", border: "1px solid rgba(59, 130, 246, 0.13)" }}>Pour toi</span>
          </div>
          <HomepageDiscoverySection tracks={discoveries} />
        </section>
      )}

      {/* NOUVEAUTÉS */}
      {newAlbums.length === 0 && hasContent && showHints && <SectionEmptyHint label="Nouveautés" />}
      {newAlbums.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(249, 115, 22, 0.10)", border: "1px solid rgba(249, 115, 22, 0.20)" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-orange)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>🎵 Dernières sorties</h2>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(249, 115, 22, 0.10)", color: "var(--color-accent-orange)", border: "1px solid rgba(249, 115, 22, 0.20)" }}>60 derniers jours</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: "none" }}>
            {newAlbums.map((album, i) => {
              const grad = CARD_GRADIENTS[i % CARD_GRADIENTS.length]!;
              return <MediaCard key={album.id} title={album.title} subtitle={(album as { artist_name?: string }).artist_name ?? undefined} gradient={grad} badge="NEW" />;
            })}
          </div>
        </section>
      )}

      {/* NOUVEAUX TALENTS */}
      {suggestedArtists.length === 0 && hasContent && showHints && <SectionEmptyHint label="Artistes à découvrir" />}
      {suggestedArtists.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>🌟 Nouveaux talents</h2>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: "none" }}>
            {suggestedArtists.map((artist, i) => {
              const c = ARTIST_RING_COLORS[i % ARTIST_RING_COLORS.length]!;
              const genre = (artist.genres as string[])[0] ?? "Artiste";
              return (
                <Link key={artist.creator_id} href="/search" className="flex-shrink-0 flex flex-col items-center gap-2 w-20 group">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-base relative transition-transform group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${c.bg}, ${c.glow})`, border: `2.5px solid ${c.ring}`, color: c.color }}>
                    {getInitials(artist.stage_name)}
                    {artist.verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "var(--color-or-solaire)", border: "2px solid var(--color-noir-profond)" }}>
                        <svg width={9} height={9} viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.8 7L9 1" stroke="black" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-center font-bold leading-tight" style={{ color: "var(--color-texte-principal)" }}>{artist.stage_name}</p>
                  <p className="text-[9px] text-center" style={{ color: "var(--color-texte-desactive)" }}>{genre}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* GENRES */}
      {genres.length === 0 && hasContent && showHints && <SectionEmptyHint label="Genres" />}
      {genres.length > 0 && (
        <section className="mt-8 px-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(236, 72, 153, 0.10)", border: "1px solid rgba(236, 72, 153, 0.20)" }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="var(--color-accent-rose)">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <h2 className="text-base font-extrabold" style={{ color: "var(--color-texte-principal)" }}>Genres</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre, i) => {
              const c = GENRE_COLORS[i % GENRE_COLORS.length]!;
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

      {/* CTA */}
      <section className="mt-8 px-6">
        <div className="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(0, 210, 106, 0.10) 0%, rgba(255, 194, 14, 0.04) 100%)", border: "1px solid rgba(0, 210, 106, 0.15)" }}>
          <div className="absolute right-0 top-0 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(0,210,106,0.1) 0%, transparent 70%)", filter: "blur(20px)" }} />
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-vert-energie)", boxShadow: "0 0 20px rgba(0,210,106,0.4)" }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z" /></svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-sm" style={{ color: "var(--color-texte-principal)" }}>Commencer l&apos;écoute</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-texte-subtil)" }}>Recherchez un morceau pour démarrer</p>
          </div>
          <Link href="/search" className="px-3.5 py-2 rounded-xl text-xs font-black flex-shrink-0"
            style={{ background: "var(--color-vert-energie)", color: "black", boxShadow: "0 0 12px rgba(0,210,106,0.4)" }}>
            Explorer
          </Link>
        </div>
      </section>

    </div>
  );
}
