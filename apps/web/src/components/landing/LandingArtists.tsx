import type { LandingArtistsSection } from "@sonafrik/types";
import Link from "next/link";
import { getAvatarPalette } from "@/lib/landing/artistDisplay";
import { LandingSectionHeader } from "./LandingSectionHeader";

interface LandingArtistsProps {
  section: LandingArtistsSection;
}

export function LandingArtists({ section }: LandingArtistsProps) {
  const { artists, trackCount } = section;
  if (artists.length === 0) return null;

  return (
    <section id="artistes" className="mb-14 scroll-mt-[88px] text-center">
      <LandingSectionHeader label="DÉJÀ SUR SONAFRIK" title="Les artistes fondateurs" />

      <div className="mb-5 flex flex-wrap justify-center gap-2.5">
        {artists.map((artist) => {
          const palette = getAvatarPalette(artist.paletteIndex);
          return (
            <Link
              key={artist.creatorId}
              href={`/listen/artist/${artist.creatorId}`}
              className="flex min-w-[160px] items-center gap-2.5 rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 no-underline transition-colors hover:bg-white/[0.07]"
            >
              <div
                className={`flex size-[38px] shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold ${palette.bg} ${palette.text} ${palette.border}`}
              >
                {artist.initials}
              </div>
              <div className="text-left">
                <p className="m-0 text-[13px] font-semibold leading-snug text-[var(--t8-pearl)]">
                  {artist.stageName}
                </p>
                <p className="m-0 text-[11px] leading-snug text-white/40">{artist.genre}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50">
        🎵 {artists.length} artiste{artists.length > 1 ? "s" : ""} · {trackCount.toLocaleString("fr-FR")}{" "}
        morceau{trackCount > 1 ? "x" : ""} · Guinée Conakry
      </div>
    </section>
  );
}
