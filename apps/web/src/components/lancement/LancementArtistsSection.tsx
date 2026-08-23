import Link from "next/link";
import { getLandingArtistsSection } from "@/lib/landing/getLandingArtistsSection";
import { getAvatarPalette } from "@/lib/landing/artistDisplay";

/** Segment streamé — artistes fondateurs chargés après le hero. */
export async function LancementArtistsSection() {
  const artistsSection = await getLandingArtistsSection();

  if (artistsSection.artists.length === 0) {
    return null;
  }

  return (
    <div className="lancement-artists text-center">
      <p className="mb-1 text-base font-bold text-[var(--t8-pearl)]">Les artistes fondateurs</p>
      <p className="mb-6 text-sm text-[var(--t8-silver)]">
        Les premiers artistes qui font confiance à la plateforme
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {artistsSection.artists.map((artist) => {
          const palette = getAvatarPalette(artist.paletteIndex);
          return (
            <Link
              key={artist.creatorId}
              href={`/listen/artist/${artist.creatorId}`}
              className="flex w-[72px] flex-col items-center no-underline"
            >
              <div
                className={`mb-2 flex size-[52px] items-center justify-center rounded-full border-2 text-base font-semibold ${palette.bg} ${palette.text} ${palette.border}`}
              >
                {artist.initials}
              </div>
              <p className="text-xs font-medium leading-snug text-[var(--t8-pearl)]">
                {artist.stageName}
              </p>
              <p className="text-[11px] leading-snug text-[var(--t8-silver)]">{artist.genre}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
