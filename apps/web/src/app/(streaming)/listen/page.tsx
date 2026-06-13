import type { Metadata } from "next";
import Link from "next/link";
import type { DiscoveryAlbum, DiscoveryArtist, DiscoveryTrack, TrendingTrack } from "@sonafrik/types";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Accueil — SONAFRIK",
  description: "Découvrez la musique africaine sur SONAFRIK.",
};

// ─── Palette de couleurs pour les cards ────────────────────────────────────────
const CARD_GRADIENTS = [
  { from: "#00D26A", to: "#009449" },
  { from: "#FFC20E", to: "#E5A800" },
  { from: "#F97316", to: "#C2410C" },
  { from: "#A855F7", to: "#7C3AED" },
  { from: "#3B82F6", to: "#1D4ED8" },
  { from: "#EC4899", to: "#BE185D" },
  { from: "#14B8A6", to: "#0F766E" },
  { from: "#EF4444", to: "#B91C1C" },
] as const;

const ARTIST_RING_COLORS = [
  "#00D26A", "#FFC20E", "#A855F7", "#3B82F6", "#F97316", "#EC4899",
] as const;

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

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
    };
  } catch {
    return { playlists: [], artists: [], genres: [], trending: [], discoveries: [], newAlbums: [], suggestedArtists: [] };
  }
}

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
        {/* Badge */}
        {badge && (
          <div
            className="self-start px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide z-10"
            style={{ background: gradient.from, color: "#000" }}
          >
            {badge}
          </div>
        )}

        {/* Vinyl décoratif */}
        <div
          className="absolute top-1/2 right-2 -translate-y-1/2 w-16 h-16 rounded-full opacity-10"
          style={{ border: `6px solid ${gradient.from}`, background: `radial-gradient(circle, ${gradient.from}40 30%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/2 right-2 -translate-y-1/2 w-6 h-6 rounded-full opacity-15"
          style={{ background: gradient.from }}
        />

        {/* Icône musique */}
        <div className="mt-auto z-10">
          <MusicNote size={18} color={gradient.from} />
        </div>

        {/* Overlay hover */}
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

// ─── Carte track découverte ────────────────────────────────────────────────────
function TrackCard({ track, gradient }: { track: DiscoveryTrack; gradient: { from: string; to: string } }) {
  return (
    <div className="flex-shrink-0 w-32 group cursor-pointer">
      <div
        className="aspect-square rounded-xl mb-2 flex items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${gradient.from}1A 0%, ${gradient.to}0D 100%)`,
          border: `1px solid ${gradient.from}25`,
        }}
      >
        <MusicNote size={22} color={gradient.from} />
        {/* Like count */}
        {track.like_count > 0 && (
          <div
            className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <svg width={8} height={8} viewBox="0 0 24 24" fill="#00D26A">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-[9px] font-bold" style={{ color: "#00D26A" }}>{formatCount(track.like_count)}</span>
          </div>
        )}
        {/* Play hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#00D26A", boxShadow: "0 0 14px rgba(0,210,106,0.7)" }}>
            <svg width={12} height={12} viewBox="0 0 12 14" fill="#000"><path d="M0 0L12 7L0 14V0Z" /></svg>
          </div>
        </div>
      </div>
      <p className="text-xs font-semibold truncate" style={{ color: "#FFFFFF" }}>{track.title}</p>
      {track.artist_name && <p className="text-[10px] mt-0.5 truncate" style={{ color: "#777777" }}>{track.artist_name}</p>}
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default async function ListenPage() {
  const [
    { profile },
    { playlists, artists, genres, trending, discoveries, newAlbums, suggestedArtists },
  ] = await Promise.all([requireIdentityContext(), getHomepageContent()]);

  const firstName = profile.full_name?.split(" ")[0] ?? "là";
  const hour = new Date().getUTCHours() + 1; // UTC+1 approximatif
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100%" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
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
        {/* Orbe vert décoratif */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,210,106,0.12) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        {/* Top row: greeting + avatar */}
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
            {/* Notification */}
            <div className="relative cursor-pointer">
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: "#EF4444", fontSize: 7, fontWeight: 800, color: "#fff", border: "1.5px solid #0A0A0A" }}
              >2</div>
            </div>
            {/* Avatar */}
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

        {/* Barre de recherche */}
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

      <div className="pb-8">

        {/* ── TENDANCES ────────────────────────────────────────────────────── */}
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

            <div className="px-6 space-y-0.5">
              {trending.map((track, i) => {
                const isTop = i < 3;
                return (
                  <div
                    key={track.track_id}
                    className="flex items-center gap-3 py-3 rounded-xl px-3 group cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid #141414" }}
                  >
                    {/* Rank */}
                    <div
                      className="w-6 flex-shrink-0 text-right"
                    >
                      {isTop ? (
                        <span
                          className="text-sm font-black"
                          style={{ color: i === 0 ? "#00D26A" : i === 1 ? "#FFC20E" : "#F97316" }}
                        >
                          {i + 1}
                        </span>
                      ) : (
                        <span className="text-xs font-bold" style={{ color: "#444444" }}>{i + 1}</span>
                      )}
                    </div>

                    {/* Art placeholder */}
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]!.from}28, ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]!.to}14)`,
                        border: `1px solid ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]!.from}25`,
                      }}
                    >
                      <MusicNote size={14} color={CARD_GRADIENTS[i % CARD_GRADIENTS.length]!.from} />
                      {/* Play overlay */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                        style={{ background: "rgba(0,0,0,0.6)" }}>
                        <svg width={10} height={12} viewBox="0 0 10 12" fill="#00D26A"><path d="M0 0L10 6L0 12V0Z" /></svg>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "#FFFFFF" }}>{track.title}</p>
                      {track.artist_name && (
                        <p className="text-xs truncate mt-0.5" style={{ color: "#666666" }}>{track.artist_name}</p>
                      )}
                    </div>

                    {/* Streams */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-bold tabular-nums" style={{ color: isTop ? "#00D26A" : "#444444" }}>
                        {formatCount(track.listen_count)}
                      </p>
                      <p className="text-[9px]" style={{ color: "#333333" }}>écoutes</p>
                    </div>
                  </div>
                );
              })}
            </div>
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
                      {/* Inner ring */}
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

        {/* ── DÉCOUVERTES ──────────────────────────────────────────────────── */}
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
            <div className="flex gap-3 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: "none" }}>
              {discoveries.map((track, i) => (
                <TrackCard key={track.track_id} track={track} gradient={CARD_GRADIENTS[i % CARD_GRADIENTS.length]!} />
              ))}
            </div>
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

        {/* ── ARTISTES À DÉCOUVRIR ──────────────────────────────────────────── */}
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
                    href="/search"
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

        {/* ── CTA streaming ─────────────────────────────────────────────────── */}
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
    </div>
  );
}
