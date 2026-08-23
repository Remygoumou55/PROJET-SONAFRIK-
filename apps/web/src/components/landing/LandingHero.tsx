import type { ReactNode } from "react";
import Link from "next/link";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";
import { LandingSearchBar } from "./LandingSearchBar";

interface LandingHeroProps {
  children?: ReactNode;
}

export function LandingHero({ children }: LandingHeroProps) {
  return (
    <section className="landing-hero-brand" aria-labelledby="landing-hero-title">
      <div className="landing-hero-brand__content">
        <div className="landing-hero-brand__lockup">
          <SonafrikLogo variant="wordmark" size="lg" />
        </div>

        <div className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-[var(--t8-primary-lavender)]/25 bg-[var(--t8-primary-lavender)]/10 px-3.5 py-1.5 text-xs text-[var(--t8-primary-lavender)]">
          <span className="landing-pulse-dot size-1.5 shrink-0 rounded-full bg-[var(--t8-primary-lavender)]" />
          Lancement en cours — Guinée Conakry
        </div>

        <h1
          id="landing-hero-title"
          className="landing-hero-h1 mb-4 text-[44px] font-semibold leading-tight text-[var(--t8-pearl)]"
        >
          La musique guinéenne
          <br />
          <em className="font-normal not-italic text-[var(--t8-primary-lavender)]">mérite sa plateforme</em>
        </h1>

        <p className="mx-auto mb-9 max-w-[500px] text-base leading-relaxed text-white/50">
          SONAFRIK rémunère directement les artistes. Chaque écoute compte.
          Rejoignez la communauté qui débloque le lancement.
        </p>

        <div className="mb-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/connexion"
            className="landing-hero-brand__cta landing-hero-brand__cta--primary"
          >
            Commencer maintenant
          </Link>
          <Link
            href="#comment-ca-marche"
            className="landing-hero-brand__cta landing-hero-brand__cta--ghost"
          >
            En savoir plus
          </Link>
        </div>

        <LandingSearchBar />

        <p className="mt-3 text-xs text-white/30">Gratuit · Aucune carte requise · 2 minutes</p>

        {children}
      </div>
    </section>
  );
}
