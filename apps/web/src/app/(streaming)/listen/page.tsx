import type { Metadata } from "next";
import Link from "next/link";
import type { DiscoveryAlbum, DiscoveryArtist, DiscoveryTrack, TrendingTrack } from "@sonafrik/types";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Accueil — SONAFRIK",
  description: "Découvrez la musique africaine sur SONAFRIK.",
};

const CARD_COLORS = [
  { colorA: "#00D26A", colorB: "#009B3A" },
  { colorA: "#FFC20E", colorB: "#F4A300" },
  { colorA: "#FF6B6B", colorB: "#C0392B" },
  { colorA: "#9B59B6", colorB: "#1A5276" },
  { colorA: "#3498DB", colorB: "#2471A3" },
  { colorA: "#E74C3C", colorB: "#A93226" },
] as const;

const ARTIST_COLORS = [
  "#00D26A",
  "#FFC20E",
  "#9B59B6",
  "#E74C3C",
  "#3498DB",
  "#FF6B6B",
] as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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
      supabase
        .from("playlists")
        .select("id, title, track_count")
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(6),
      supabase
        .from("artist_profiles")
        .select("creator_id, stage_name, genres")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("genres")
        .select("id, name")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("sort_order")
        .limit(12),
      supabase.rpc("get_trending_tracks" as never, { p_window: "7d", p_limit: 10 } as never),
      supabase.rpc("get_discovery_feed" as never, { p_limit: 8 } as never),
      supabase.rpc("get_new_releases" as never, { p_type: "album", p_days: 60, p_limit: 6 } as never),
      supabase.rpc("get_suggested_artists" as never, { p_limit: 6 } as never),
    ]);

    return {
      playlists: (playlistsResult.data ?? []) as Array<{
        id: string;
        title: string;
        track_count: number;
      }>,
      artists: (artistsResult.data ?? []) as Array<{
        creator_id: string;
        stage_name: string;
        genres: string[];
      }>,
      genres: (genresResult.data ?? []) as Array<{
        id: string;
        name: string;
      }>,
      trending: (trendingResult.data ?? []) as TrendingTrack[],
      discoveries: (discoveryResult.data ?? []) as DiscoveryTrack[],
      newAlbums: ((newAlbumsResult.data as { albums?: DiscoveryAlbum[] } | null)?.albums ?? []) as DiscoveryAlbum[],
      suggestedArtists: (suggestedArtistsResult.data ?? []) as DiscoveryArtist[],
    };
  } catch {
    return { playlists: [], artists: [], genres: [], trending: [], discoveries: [], newAlbums: [], suggestedArtists: [] };
  }
}

export default async function ListenPage() {
  const [
    { profile },
    { playlists, artists, genres, trending, discoveries, newAlbums, suggestedArtists },
  ] = await Promise.all([requireIdentityContext(), getHomepageContent()]);

  const firstName = profile.full_name?.split(" ")[0] ?? "artiste";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0D0D0D" }}>
      {/* ── En-tête de bienvenue ─────────────────────────── */}
      <div className="px-6 pt-8 pb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
              Bonjour,
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#A0A0A0" }}>
              Découvrez la musique africaine
            </p>
          </div>
          {/* Avatar initial */}
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
          >
            {firstName[0]?.toUpperCase() ?? "?"}
          </Link>
        </div>

        {/* Barre de recherche (navigation vers /search) */}
        <Link
          href="/search"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full"
          style={{ backgroundColor: "#1F1F1F", border: "1px solid #2A2A2A" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="#555555" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-sm" style={{ color: "#555555" }}>
            Rechercher un artiste, une chanson…
          </span>
        </Link>
      </div>

      {/* ── Tendances ───────────────────────────────────── */}
      {trending.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-base font-bold" style={{ color: "#FFFFFF" }}>
              Tendances
            </h2>
            <span className="text-xs font-semibold" style={{ color: "#00D26A" }}>
              7 derniers jours
            </span>
          </div>
          <div className="space-y-1 px-6">
            {trending.map((track, i) => (
              <div
                key={track.track_id}
                className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: "1px solid #1F1F1F" }}
              >
                <span
                  className="text-xs font-bold w-5 text-right flex-shrink-0 tabular-nums"
                  style={{ color: i < 3 ? "#00D26A" : "#555555" }}
                >
                  {i + 1}
                </span>
                <div
                  className="w-9 h-9 rounded-md flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: "#1F1F1F" }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="#00D26A">
                    <path d="M4 2L14 8L4 14V2Z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
                    {track.title}
                  </p>
                  {track.artist_name && (
                    <p className="text-xs truncate" style={{ color: "#A0A0A0" }}>
                      {track.artist_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-xs tabular-nums" style={{ color: "#555555" }}>
                    {track.listen_count.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-[10px]" style={{ color: "#333333" }}>
                    écoutes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Pour vous (playlists publiques) ─────────────── */}
      {playlists.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-base font-bold" style={{ color: "#FFFFFF" }}>
              Pour vous
            </h2>
            <Link href="/search" className="text-xs font-semibold" style={{ color: "#00D26A" }}>
              Voir tout
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 px-6 scrollbar-hide">
            {playlists.map((pl, i) => {
              const colors = CARD_COLORS[i % CARD_COLORS.length]!;
              const subtitle =
                pl.track_count > 0
                  ? `${pl.track_count} titre${pl.track_count > 1 ? "s" : ""}`
                  : "Playlist";
              return (
                <Link key={pl.id} href="/search" className="flex-shrink-0 w-36">
                  <div
                    className="aspect-square rounded-2xl mb-2 flex flex-col justify-end p-3 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${colors.colorA}33 0%, ${colors.colorB}1A 100%)`,
                      backgroundColor: "#1F1F1F",
                      border: "1px solid #2A2A2A",
                    }}
                  >
                    {/* Vinyl decoratif */}
                    <div
                      className="absolute top-3 right-3 w-12 h-12 rounded-full opacity-20"
                      style={{
                        border: `3px solid ${colors.colorA}`,
                        boxShadow: `0 0 0 5px ${colors.colorA}22`,
                      }}
                    />
                    <div
                      className="absolute top-6 right-6 w-4 h-4 rounded-full"
                      style={{ backgroundColor: colors.colorA, opacity: 0.3 }}
                    />
                    <p className="text-sm font-bold leading-tight relative z-10" style={{ color: "#FFFFFF" }}>
                      {pl.title}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "#A0A0A0" }}>
                    {subtitle}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Top artistes ────────────────────────────────── */}
      {artists.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-base font-bold" style={{ color: "#FFFFFF" }}>
              Top artistes
            </h2>
            <Link href="/search" className="text-xs font-semibold" style={{ color: "#00D26A" }}>
              Voir tout
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 px-6 scrollbar-hide">
            {artists.map((artist, i) => {
              const color = ARTIST_COLORS[i % ARTIST_COLORS.length]!;
              const genre = (artist.genres as string[])[0] ?? "Artiste";
              return (
                <Link
                  key={artist.creator_id}
                  href="/search"
                  className="flex-shrink-0 flex flex-col items-center gap-2 w-20"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${color}33, ${color}1A)`,
                      border: `2px solid ${color}55`,
                      color,
                    }}
                  >
                    {getInitials(artist.stage_name)}
                  </div>
                  <p
                    className="text-xs text-center font-semibold leading-tight"
                    style={{ color: "#FFFFFF" }}
                  >
                    {artist.stage_name}
                  </p>
                  <p className="text-[10px]" style={{ color: "#A0A0A0" }}>
                    {genre}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Découvertes ─────────────────────────────────── */}
      {discoveries.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-base font-bold" style={{ color: "#FFFFFF" }}>
              Découvertes
            </h2>
            <span className="text-xs font-semibold" style={{ color: "#00D26A" }}>
              Pour toi
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 px-6 scrollbar-hide">
            {discoveries.map((track) => (
              <div
                key={track.track_id}
                className="flex-shrink-0 w-32"
              >
                <div
                  className="aspect-square rounded-xl mb-2 flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: "#1F1F1F", border: "1px solid #2A2A2A" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#00D26A" opacity={0.6}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {track.like_count > 0 && (
                    <div
                      className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ backgroundColor: "#00D26A22", color: "#00D26A" }}
                    >
                      ♥ {track.like_count}
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold truncate" style={{ color: "#FFFFFF" }}>
                  {track.title}
                </p>
                {track.artist_name && (
                  <p className="text-[10px] truncate mt-0.5" style={{ color: "#A0A0A0" }}>
                    {track.artist_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Nouveautés — Albums ──────────────────────────── */}
      {newAlbums.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-base font-bold" style={{ color: "#FFFFFF" }}>
              Nouveautés
            </h2>
            <span className="text-xs font-semibold" style={{ color: "#00D26A" }}>
              60 derniers jours
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 px-6 scrollbar-hide">
            {newAlbums.map((album) => (
              <div key={album.id} className="flex-shrink-0 w-32">
                <div
                  className="aspect-square rounded-xl mb-2"
                  style={{ backgroundColor: "#1F1F1F", border: "1px solid #2A2A2A" }}
                />
                <p className="text-xs font-semibold truncate" style={{ color: "#FFFFFF" }}>
                  {album.title}
                </p>
                {album.artist_name && (
                  <p className="text-[10px] truncate mt-0.5" style={{ color: "#A0A0A0" }}>
                    {album.artist_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Artistes à découvrir ─────────────────────────── */}
      {suggestedArtists.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-base font-bold" style={{ color: "#FFFFFF" }}>
              Artistes à découvrir
            </h2>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 px-6 scrollbar-hide">
            {suggestedArtists.map((artist, i) => {
              const color = ARTIST_COLORS[i % ARTIST_COLORS.length]!;
              const genre = (artist.genres as string[])[0] ?? "Artiste";
              return (
                <Link
                  key={artist.creator_id}
                  href="/search"
                  className="flex-shrink-0 flex flex-col items-center gap-2 w-20"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 relative"
                    style={{
                      background: `linear-gradient(135deg, ${color}33, ${color}1A)`,
                      border: `2px solid ${color}55`,
                      color,
                    }}
                  >
                    {getInitials(artist.stage_name)}
                    {artist.verified && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                        style={{ backgroundColor: "#FFC20E", color: "#0D0D0D" }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs text-center font-semibold leading-tight"
                    style={{ color: "#FFFFFF" }}
                  >
                    {artist.stage_name}
                  </p>
                  <p className="text-[10px]" style={{ color: "#A0A0A0" }}>
                    {genre}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Genres ──────────────────────────────────────── */}
      {genres.length > 0 && (
        <section className="px-6 mb-10">
          <h2 className="text-base font-bold mb-4" style={{ color: "#FFFFFF" }}>
            Genres
          </h2>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                href="/search"
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "#1F1F1F",
                  border: "1px solid #333333",
                  color: "#A0A0A0",
                }}
              >
                #{genre.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Appel à l'action streaming ───────────────────── */}
      <section className="px-6 mb-8">
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, #00D26A18 0%, #FFC20E0D 100%)",
            border: "1px solid #00D26A22",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#00D26A" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#0D0D0D">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm" style={{ color: "#FFFFFF" }}>
              Commencer l&apos;écoute
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#A0A0A0" }}>
              Recherchez un morceau pour démarrer
            </p>
          </div>
          <Link
            href="/search"
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
          >
            Explorer
          </Link>
        </div>
      </section>
    </div>
  );
}
