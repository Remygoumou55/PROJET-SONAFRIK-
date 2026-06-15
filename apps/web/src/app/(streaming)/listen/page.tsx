import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import type { DiscoveryAlbum, DiscoveryArtist, DiscoveryTrack, TrendingTrack } from "@sonafrik/types";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";
import { CARD_GRADIENTS } from "@/lib/constants";
import { HomepageTrendingSection } from "@/features/streaming/components/HomepageTrendingRow";
import { HomepageDiscoverySection } from "@/features/streaming/components/HomepageDiscoverySection";

export const metadata: Metadata = {
  title: "Accueil — SONAFRIK",
  description: "Découvrez la musique africaine sur SONAFRIK.",
};

const ARTIST_RING_COLORS = [
  "#00D26A", "#FFC20E", "#A855F7", "#3B82F6", "#F97316", "#EC4899",
] as const;

// ─── Fetch données homepage ────────────────────────────────────────────────────
async function getHomepageContent() {
  try {
    const supabase = await getSupabaseServerClient();
    const [
      playlistsResult,
      artistsResult,
      genresResult,
      trendingResult,
      discoveryResult,
      newAlbumsResult,
      suggestedArtistsResult,
    ] = await Promise.all([
      supabase.from("playlists").select("id, title, track_count").eq("is_public", true).is("deleted_at", null).order("updated_at", { ascending: false }).limit(8),
      supabase.from("artist_profiles").select("creator_id, stage_name, genres").eq("is_public", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("genres").select("id, name").eq("is_active", true).is("deleted_at", null).order("sort_order").limit(14),
      supabase.rpc("get_trending_tracks", { p_window: "7d", p_limit: 10 }),
      supabase.rpc("get_discovery_feed", { p_limit: 8 }),
      supabase.rpc("get_new_releases", { p_type: "album", p_days: 60, p_limit: 8 }),
      supabase.rpc("get_suggested_artists", { p_limit: 8 }),
    ]);
    return {
      playlists: (playlistsResult.data ?? []) as Array<{ id: string; title: string; track_count: number }>,
      artists: (artistsResult.data ?? []) as Array<{ creator_id: string; stage_name: string; genres: string[] }>,
      genres: (genresResult.data ?? []) as Array<{ id: string; name: string }>,
      trending: (trendingResult.data ?? []) as unknown as TrendingTrack[],
      discoveries: (discoveryResult.data ?? []) as unknown as DiscoveryTrack[],
      newAlbums: ((newAlbumsResult.data as unknown as { albums?: DiscoveryAlbum[] } | null)?.albums ?? []) as DiscoveryAlbum[],
      suggestedArtists: (suggestedArtistsResult.data ?? []) as unknown as DiscoveryArtist[],
      hadError: false,
    };
  } catch (err) {
    console.error("[Homepage] getHomepageContent failed:", err);
    return { playlists: [], artists: [], genres: [], trending: [], discoveries: [], newAlbums: [], suggestedArtists: [], hadError: true };
  }
}

type HomepageContent = Awaited<ReturnType<typeof getHomepageContent>>;

// ─── Icône note de musique ─────────────────────────────────────────────────────
function MusicNote({ size = 20, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" fill={color} />
      <circle cx="18" cy="16" r="3" fill={color} />
    </svg>
  );
}

// ─── Carte album/playlist ──────────────────────────────────────────────────────
function MediaCard({
  title, subtitle, gradient, href = "/search", badge,
}: {
  title: string;
  subtitle?: string;
  gradient: { from: string; to: string };
  href?: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="flex-shrink-0 w-36 group">
      <div
        className="aspect-square rounded-2xl mb-2.5 flex flex-col justify-between p-3 relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${gradient.from}28 0%, ${gradient.to}14 100%)`,
          border: `1px solid ${gradient.from}30`,
          boxShadow: `0 4px 20px ${gradient.from}14`,
        }}
      >
        {badge && (
          <div
            className="self-start px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide z-10"
            style={{ background: gradient.from, color: "#000" }}
          >
            {badge}
          </div>
        )}
        <div
          className="absolute top-1/2 right-2 -translate-y-1/2 w-16 h-16 rounded-full opacity-10"
          style={{ border: `6px solid ${gradient.from}`, background: `radial-gradient(circle, ${gradient.from}40 30%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/2 right-2 -translate-y-1/2 w-6 h-6 rounded-full opacity-15"
          style={{ background: gradient.from }}
        />
        <div className="mt-auto z-10">
          <MusicNote size={18} color={gradient.from} />
        </div>
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: gradient.from, boxShadow: `0 0 16px ${gradient.from}88` }}
          >
            <svg width={14} height={14} viewBox="0 0 12 14" fill="#000">
              <path d="M0 0L12 7L0 14V0Z" />
            </svg>
          </div>
        </div>
      </div>
      <p className="text-xs font-bold truncate" style={{ color: "#FFFFFF" }}>{title}</p>
      {subtitle && <p className="text-[10px] mt-0.5 truncate" style={{ color: "#777777" }}>{subtitle}</p>}
    </Link>
  );
}

// ─── Skeleton affiché pendant le chargement des sections contenu ───────────────
function ContentSkeleton() {
  return (
    <div className="pb-8 mt-8 space-y-10">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="px-6 space-y-3">
          <div
            className="h-4 w-28 rounded-full animate-pulse"
            style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 80}ms` }}
          />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(4)].map((_, j) => (
              <div
                key={j}
                className="w-32 h-32 rounded-2xl flex-shrink-0 animate-pulse"
                style={{ backgroundColor: "#1F1F1F", animationDelay: `${(i * 4 + j) * 40}ms` }}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="px-6 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 animate-pulse"
            style={{ animationDelay: `${240 + i * 60}ms` }}
          >
            <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: "#1F1F1F" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "#1F1F1F" }} />
              <div className="h-2.5 w-1/2 rounded" style={{ backgroundColor: "#1F1F1F" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sections contenu (rendues après résolution des données) ──────────────────
function HomepageContentSections({ content }: { content: HomepageContent }) {
  const { playlists, artists, genres, trending, discoveries, newAlbums, suggestedArtists, hadError } = content;

  const hasContent =
    trending.length > 0 || playlists.length > 0 || artists.length > 0 ||
    discoveries.length > 0 || newAlbums.length > 0 || suggestedArtists.length > 0 || genres.length > 0;

  return (
    <div className="pb-8">

      {hadError && (
        <div
          className="mx-6 mt-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "#FF444418", color: "#FF8888", border: "1px solid #FF444433" }}
          role="alert"
        >
          Contenu temporairement indisponible. Réessayez dans quelques instants.
        </div>
      )}

      {/* ── EMPTY STATE — aucun contenu dans Supabase ────────────────────── */}
      {!hadError && !hasContent && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ background: "linear-gradient(135deg, #00D26A1A, #00D26A0A)", border: "1px solid #00D26A30" }}
          >
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <path d="M9 18V5l12-2v13" stroke="#00D26A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" fill="#00D26A" opacity="0.7" />
              <circle cx="18" cy="16" r="3" fill="#00D26A" opacity="0.4" />
            </svg>
          </div>
          <p className="text-xl font-extrabold mb-2" style={{ color: "#FFFFFF" }}>
            La musique arrive bientôt
          </p>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#666666" }}>
            Les artistes guinéens rejoignent SONAFRIK. En attendant, explorez et recherchez votre musique préférée.
          </p>
          <Link
            href="/search"
            className="mt-6 px-6 py-3 rounded-2xl text-sm font-black"
            style={{ background: "#00D26A", color: "#000", boxShadow: "0 0 20px rgba(0,210,106,0.35)" }}
          >
            Explorer la musique
          </Link>
        </div>
      )}

      {/* ── TENDANCES ──────────────────────────────────────────────────────── */}
      {trending.length > 0 && (
        <section className="mt-8 mb-2">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #00D26A22, #00D26A11)", border: "1px solid #00D26A33" }}
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="#00D26A">
                  <path d="M22 7l-9 9-4-4-7 7" stroke="#00D26A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M16 7h6v6" stroke="#00D26A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "#FFFFFF" }}>Tendances</h2>
            </div>
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "#00D26A14", color: "#00D26A", border: "1px solid #00D26A22" }}
            >
              7 derniers jours
            </span>
          </div>
          <HomepageTrendingSection tracks={trending} />
        </section>
      )}

      {/* ── POUR VOUS (playlists) ─────────────────────────────────────────── */}
      {playlists.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#FFC20E1A", border: "1px solid #FFC20E33" }}
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#FFC20E" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "#FFFFFF" }}>Pour vous</h2>
            </div>
            <Link href="/library" className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "#1A1A1A", color: "#00D26A", border: "1px solid #2A2A2A" }}>
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

      {/* ── TOP ARTISTES ─────────────────────────────────────────────────── */}
      {artists.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#A855F71A", border: "1px solid #A855F733" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "#FFFFFF" }}>Top artistes</h2>
            </div>
            <Link href="/search" className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "#1A1A1A", color: "#00D26A", border: "1px solid #2A2A2A" }}>
              Voir tout →
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: "none" }}>
            {artists.map((artist, i) => {
              const color = ARTIST_RING_COLORS[i % ARTIST_RING_COLORS.length]!;
              const genre = (artist.genres as string[])[0] ?? "Artiste";
              return (
                <Link
                  key={artist.creator_id}
                  href="/search"
                  className="flex-shrink-0 flex flex-col items-center gap-2 w-20 group"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-black text-base relative transition-transform group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${color}25, ${color}10)`,
                      border: `2.5px solid ${color}50`,
                      color,
                      boxShadow: `0 0 0 0 ${color}00`,
                      transition: "box-shadow 0.2s",
                    }}
                  >
                    {getInitials(artist.stage_name)}
                    <div
                      className="absolute inset-0 rounded-full opacity-20"
                      style={{ border: `1px solid ${color}` }}
                    />
                  </div>
                  <p className="text-[11px] text-center font-bold leading-tight" style={{ color: "#DDDDDD" }}>
                    {artist.stage_name}
                  </p>
                  <p className="text-[9px] text-center" style={{ color: "#555555" }}>{genre}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── DÉCOUVERTES ─────────────────────────────────────────────────────── */}
      {discoveries.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#3B82F61A", border: "1px solid #3B82F633" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "#FFFFFF" }}>Découvertes</h2>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "#3B82F614", color: "#3B82F6", border: "1px solid #3B82F622" }}>
              Pour toi
            </span>
          </div>
          <HomepageDiscoverySection tracks={discoveries} />
        </section>
      )}

      {/* ── NOUVEAUTÉS — Albums ───────────────────────────────────────────── */}
      {newAlbums.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#F973161A", border: "1px solid #F9731633" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h2 className="text-base font-extrabold" style={{ color: "#FFFFFF" }}>Nouveautés</h2>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "#F973161A", color: "#F97316", border: "1px solid #F9731633" }}>
              60 derniers jours
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: "none" }}>
            {newAlbums.map((album, i) => {
              const grad = CARD_GRADIENTS[i % CARD_GRADIENTS.length]!;
              return (
                <MediaCard
                  key={album.id}
                  title={album.title}
                  subtitle={album.artist_name ?? undefined}
                  gradient={grad}
                  badge="NEW"
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── ARTISTES À DÉCOUVRIR ─────────────────────────────────────────── */}
      {suggestedArtists.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-base font-extrabold" style={{ color: "#FFFFFF" }}>Artistes à découvrir</h2>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: "none" }}>
            {suggestedArtists.map((artist, i) => {
              const color = ARTIST_RING_COLORS[i % ARTIST_RING_COLORS.length]!;
              const genre = (artist.genres as string[])[0] ?? "Artiste";
              return (
                <Link
                  key={artist.creator_id}
                  href="/search"
                  className="flex-shrink-0 flex flex-col items-center gap-2 w-20 group"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-black text-base relative transition-transform group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${color}25, ${color}10)`,
                      border: `2.5px solid ${color}50`,
                      color,
                    }}
                  >
                    {getInitials(artist.stage_name)}
                    {artist.verified && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "#FFC20E", border: "2px solid #0A0A0A" }}
                      >
                        <svg width={9} height={9} viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.8 7L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-center font-bold leading-tight" style={{ color: "#DDDDDD" }}>
                    {artist.stage_name}
                  </p>
                  <p className="text-[9px] text-center" style={{ color: "#555555" }}>{genre}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── GENRES ───────────────────────────────────────────────────────── */}
      {genres.length > 0 && (
        <section className="mt-8 px-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#EC48991A", border: "1px solid #EC489933" }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="#EC4899">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <h2 className="text-base font-extrabold" style={{ color: "#FFFFFF" }}>Genres</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre, i) => {
              const colors = [
                { bg: "#00D26A14", text: "#00D26A", border: "#00D26A30" },
                { bg: "#FFC20E14", text: "#FFC20E", border: "#FFC20E30" },
                { bg: "#A855F714", text: "#A855F7", border: "#A855F730" },
                { bg: "#3B82F614", text: "#3B82F6", border: "#3B82F630" },
                { bg: "#F9731614", text: "#F97316", border: "#F9731630" },
                { bg: "#EC489914", text: "#EC4899", border: "#EC489930" },
              ];
              const c = colors[i % colors.length]!;
              return (
                <Link
                  key={genre.id}
                  href={`/search?genre=${encodeURIComponent(genre.name)}`}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-opacity hover:opacity-80"
                  style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                >
                  {genre.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── CTA streaming ────────────────────────────────────────────────── */}
      <section className="mt-8 px-6">
        <div
          className="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #00D26A1A 0%, #FFC20E0A 100%)",
            border: "1px solid #00D26A25",
          }}
        >
          <div
            className="absolute right-0 top-0 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(0,210,106,0.1) 0%, transparent 70%)", filter: "blur(20px)" }}
          />
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#00D26A", boxShadow: "0 0 20px rgba(0,210,106,0.4)" }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="#000">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-sm" style={{ color: "#FFFFFF" }}>Commencer l&apos;écoute</p>
            <p className="text-xs mt-0.5" style={{ color: "#666666" }}>
              Recherchez un morceau pour démarrer
            </p>
          </div>
          <Link
            href="/search"
            className="px-3.5 py-2 rounded-xl text-xs font-black flex-shrink-0"
            style={{ background: "#00D26A", color: "#000", boxShadow: "0 0 12px rgba(0,210,106,0.4)" }}
          >
            Explorer
          </Link>
        </div>
      </section>

    </div>
  );
}

// ─── Fetcher RSC suspendu jusqu'à résolution des données contenu ──────────────
async function HomepageContentFetcher({ promise }: { promise: Promise<HomepageContent> }) {
  const content = await promise;
  return <HomepageContentSections content={content} />;
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default async function ListenPage() {
  // Lance les deux fetches en parallèle dès l'entrée dans la page.
  // getHomepageContent() démarre ses 7 requêtes pendant que requireIdentityContext()
  // se résout — gain réel sur la latence perçue.
  const contentPromise = getHomepageContent();
  const { profile, unreadNotifications } = await requireIdentityContext();

  const firstName = profile.full_name?.split(" ")[0] ?? "là";
  const hour = new Date().getUTCHours(); // Guinée = UTC+0 (GMT)
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100%" }}>

      {/* ── HERO — rendu immédiatement après résolution de l'identité ─────── */}
      <div
        className="relative overflow-hidden px-6 pt-8 pb-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 120% at 100% 50%, rgba(0,210,106,0.13) 0%, transparent 60%),
            radial-gradient(ellipse 50% 80% at 0% 100%, rgba(255,194,14,0.06) 0%, transparent 50%),
            linear-gradient(to bottom, #111111, #0A0A0A)
          `,
          borderBottom: "1px solid #1A1A1A",
        }}
      >
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,210,106,0.12) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        <div className="flex items-start justify-between mb-6 relative z-10">
          <div>
            <p className="text-xs font-semibold mb-1 tracking-widest uppercase" style={{ color: "#00D26A" }}>
              SONAFRIK
            </p>
            <h1 className="text-2xl font-extrabold leading-tight" style={{ color: "#FFFFFF" }}>
              {greeting},<br />
              <span style={{ color: "#00D26A" }}>{firstName} 👋</span>
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "#666666" }}>
              Découvrez la musique africaine
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/settings/notifications" className="relative" aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} non lues)` : ""}`}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifications > 0 && (
                <div
                  className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ background: "#EF4444", fontSize: 7, fontWeight: 800, color: "#fff", border: "1.5px solid #0A0A0A" }}
                >
                  {unreadNotifications}
                </div>
              )}
            </Link>
            <Link href="/profile">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
                style={{
                  background: "linear-gradient(135deg, #00D26A, #009449)",
                  color: "#000",
                  boxShadow: "0 0 14px rgba(0,210,106,0.4)",
                }}
              >
                {getInitials(profile.full_name ?? firstName)}
              </div>
            </Link>
          </div>
        </div>

        <Link
          href="/search"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full relative z-10"
          style={{
            background: "#161616",
            border: "1px solid #2A2A2A",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}
        >
          <svg width={16} height={16} viewBox="0 0 20 20" fill="none" stroke="#444" strokeWidth="2">
            <circle cx="8" cy="8" r="6" />
            <path d="M13 13L18 18" strokeLinecap="round" />
          </svg>
          <span className="text-sm" style={{ color: "#444444" }}>Artiste, chanson, album…</span>
          <div
            className="ml-auto px-2.5 py-1 rounded-lg text-[10px] font-bold"
            style={{ background: "#00D26A18", color: "#00D26A", border: "1px solid #00D26A33" }}
          >
            Chercher
          </div>
        </Link>
      </div>

      {/* ── CONTENU — stream via Suspense pendant le chargement des données ── */}
      <Suspense fallback={<ContentSkeleton />}>
        <HomepageContentFetcher promise={contentPromise} />
      </Suspense>

    </div>
  );
}
