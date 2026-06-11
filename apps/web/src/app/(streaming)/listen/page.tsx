import type { Metadata } from "next";
import Link from "next/link";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";

export const metadata: Metadata = {
  title: "Accueil — SONAFRIK",
  description: "Découvrez la musique africaine sur SONAFRIK.",
};

const FEATURED_PLAYLISTS = [
  {
    id: "afro-vibes",
    title: "Afro Vibes",
    subtitle: "50 titres",
    colorA: "#00D26A",
    colorB: "#009B3A",
  },
  {
    id: "hits-moment",
    title: "Hits du moment",
    subtitle: "50 titres",
    colorA: "#FFC20E",
    colorB: "#F4A300",
  },
  {
    id: "new-afro",
    title: "New Afro",
    subtitle: "50 titres",
    colorA: "#FF6B6B",
    colorB: "#C0392B",
  },
  {
    id: "roots-africa",
    title: "Roots Africa",
    subtitle: "40 titres",
    colorA: "#9B59B6",
    colorB: "#1A5276",
  },
] as const;

const TOP_ARTISTS = [
  { id: "yemi-alade", name: "Yemi Alade", genre: "Afropop", initials: "YA", color: "#00D26A" },
  { id: "burna-boy", name: "Burna Boy", genre: "Afrobeats", initials: "BB", color: "#FFC20E" },
  { id: "wizkid", name: "Wizkid", genre: "Afrobeats", initials: "WZ", color: "#9B59B6" },
  { id: "aya-nakamura", name: "Aya Nakamura", genre: "Afropop", initials: "AN", color: "#E74C3C" },
] as const;

const GENRES = [
  "#Afrobeat",
  "#Coupé-Décalé",
  "#Ndombolo",
  "#Afropop",
  "#Mbalax",
  "#Highlife",
  "#Amapiano",
  "#Afrosoul",
] as const;

export default async function ListenPage() {
  const { profile } = await requireIdentityContext();
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

      {/* ── Pour vous ───────────────────────────────────── */}
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
          {FEATURED_PLAYLISTS.map((pl) => (
            <Link key={pl.id} href="/search" className="flex-shrink-0 w-36">
              <div
                className="aspect-square rounded-2xl mb-2 flex flex-col justify-end p-3 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${pl.colorA}33 0%, ${pl.colorB}1A 100%)`,
                  backgroundColor: "#1F1F1F",
                  border: "1px solid #2A2A2A",
                }}
              >
                {/* Vinyl decoratif */}
                <div
                  className="absolute top-3 right-3 w-12 h-12 rounded-full opacity-20"
                  style={{ border: `3px solid ${pl.colorA}`, boxShadow: `0 0 0 5px ${pl.colorA}22` }}
                />
                <div
                  className="absolute top-6 right-6 w-4 h-4 rounded-full"
                  style={{ backgroundColor: pl.colorA, opacity: 0.3 }}
                />
                <p className="text-sm font-bold leading-tight relative z-10" style={{ color: "#FFFFFF" }}>
                  {pl.title}
                </p>
              </div>
              <p className="text-xs" style={{ color: "#A0A0A0" }}>
                {pl.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Top artistes ────────────────────────────────── */}
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
          {TOP_ARTISTS.map((artist) => (
            <Link
              key={artist.id}
              href="/search"
              className="flex-shrink-0 flex flex-col items-center gap-2 w-20"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${artist.color}33, ${artist.color}1A)`,
                  border: `2px solid ${artist.color}55`,
                  color: artist.color,
                }}
              >
                {artist.initials}
              </div>
              <p className="text-xs text-center font-semibold leading-tight" style={{ color: "#FFFFFF" }}>
                {artist.name}
              </p>
              <p className="text-[10px]" style={{ color: "#A0A0A0" }}>
                {artist.genre}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Genres ──────────────────────────────────────── */}
      <section className="px-6 mb-10">
        <h2 className="text-base font-bold mb-4" style={{ color: "#FFFFFF" }}>
          Genres
        </h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Link
              key={genre}
              href="/search"
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: "#1F1F1F",
                border: "1px solid #333333",
                color: "#A0A0A0",
              }}
            >
              {genre}
            </Link>
          ))}
        </div>
      </section>

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
