import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";
import { LancementHeroStatsSection } from "@/components/lancement/LancementHeroStatsSection";
import { LancementProgressBarSection } from "@/components/lancement/LancementProgressBarSection";
import { LancementProgressFallback } from "@/components/lancement/LancementProgressFallback";
import { LancementArtistsSection } from "@/components/lancement/LancementArtistsSection";
import { LancementHelpSection } from "@/components/lancement/LancementHelpSection";
import { LancementBuildSection } from "@/components/lancement/LancementBuildSection";
import { LancementArtistsFallback } from "@/components/lancement/LancementArtistsFallback";
import { LancementHeroStatsFallback } from "@/components/lancement/LancementHeroStatsFallback";

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

export default function LancementPage() {
  return (
    <div className="lancement-page">
      <header className="flex items-center justify-between px-6 py-5">
        <SonafrikLogo variant="nav" size="sm" href="/" />
        <Link
          href="/auth/connexion"
          className="rounded-full border border-elevated bg-[var(--t8-surface-01)] px-4 py-1.5 text-sm font-medium text-[var(--t8-pearl)] transition-opacity hover:opacity-80"
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
          <Suspense fallback={<LancementHeroStatsFallback />}>
            <LancementHeroStatsSection />
          </Suspense>
        </section>

        <Suspense fallback={<LancementProgressFallback />}>
          <LancementProgressBarSection />
        </Suspense>

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

        <Suspense fallback={<LancementArtistsFallback />}>
          <LancementArtistsSection />
        </Suspense>
      </main>

      <footer className="px-6 py-6 text-center">
        <p className="text-xs text-bordure">© 2026 SONAFRIK — Notre Bien Commun</p>
      </footer>
    </div>
  );
}
