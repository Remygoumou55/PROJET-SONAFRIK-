import type { Metadata } from "next";
import Link from "next/link";
import { getLaunchProgress } from "@/lib/landing/getLaunchProgress";
import { getLandingArtistsSection } from "@/lib/landing/getLandingArtistsSection";
import { getAvatarPalette } from "@/lib/landing/artistDisplay";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";
import { LancementHeroStats } from "@/components/lancement/LancementHeroStats";
import { LancementProgressBar } from "@/components/lancement/LancementProgressBar";
import { LancementHelpSection } from "@/components/lancement/LancementHelpSection";
import { LancementBuildSection } from "@/components/lancement/LancementBuildSection";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "SONAFRIK — Notre Bien Commun",
  description:
    "Rejoignez le mouvement SONAFRIK. Plateforme de streaming musical guinéenne en route vers son lancement officiel.",
  openGraph: {
    title: "SONAFRIK — Notre Bien Commun",
    description: "2 000 abonnés = lancement de la plateforme musicale guinéenne.",
    siteName: "SONAFRIK",
  },
};

export default async function LancementPage() {
  const [progress, artistsSection] = await Promise.all([
    getLaunchProgress(),
    getLandingArtistsSection(),
  ]);

  return (
    <div className="lancement-page">
      <header className="flex items-center justify-between px-6 py-5">
        <SonafrikLogo variant="nav" size="sm" href="/" />
        <Link
          href="/auth/connexion"
          className="rounded-full border border-elevated bg-surface px-4 py-1.5 text-sm font-medium text-texte-principal transition-opacity hover:opacity-80"
        >
          Se connecter
        </Link>
      </header>

      <main className="lancement-main">
        <section className="lancement-hero" aria-labelledby="lancement-hero-title">
          <p className="lancement-hero-tag">Écoute · Participe · Prospère</p>
          <h1 id="lancement-hero-title" className="lancement-hero-title">
            La musique guinéenne
            <span className="lancement-hero-title-accent">mérite sa plateforme</span>
          </h1>
          <p className="lancement-hero-subtitle">
            SONAFRIK rémunère directement les artistes. Chaque écoute compte. Ensemble, nous
            débloquons le lancement.
          </p>
          {progress ? (
            <LancementHeroStats
              artistCount={progress.artistCount}
              trackCount={progress.trackCount}
            />
          ) : null}
        </section>

        {progress ? (
          <LancementProgressBar
            current={progress.current}
            target={progress.target}
            percentage={progress.percent}
            launched={progress.launched}
          />
        ) : (
          <p className="lancement-progress-message mb-8">
            Lancement en cours de préparation
          </p>
        )}

        <div className="lancement-cta-row">
          <Link href="/auth/connexion" className="lancement-cta-primary">
            Rejoindre SONAFRIK
          </Link>
          <Link href="/auth/connexion?role=listener" className="lancement-cta-secondary">
            Rejoindre comme auditeur
          </Link>
        </div>

        <LancementHelpSection />
        <LancementBuildSection />

        {artistsSection.artists.length > 0 ? (
          <div className="lancement-artists text-center">
            <p className="mb-1 text-base font-bold text-texte-principal">
              Les artistes fondateurs
            </p>
            <p className="mb-6 text-sm text-texte-secondaire">
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
                    <p className="text-xs font-medium leading-snug text-texte-principal">
                      {artist.stageName}
                    </p>
                    <p className="text-[11px] leading-snug text-texte-secondaire">
                      {artist.genre}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </main>

      <footer className="px-6 py-6 text-center">
        <p className="text-xs text-bordure">© 2026 SONAFRIK — Notre Bien Commun</p>
      </footer>
    </div>
  );
}
