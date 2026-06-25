import type { ReactNode } from "react";
import Link from "next/link";
import { LandingSearchBar } from "./LandingSearchBar";

interface LandingHeroProps {
  children?: ReactNode;
}

export function LandingHero({ children }: LandingHeroProps) {
  return (
    <section className="pb-16 text-center">
      <div className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-vert-energie/25 bg-vert-energie/10 px-3.5 py-1.5 text-xs text-vert-energie">
        <span className="landing-pulse-dot size-1.5 shrink-0 rounded-full bg-vert-energie" />
        Lancement en cours — Guinée Conakry
      </div>

      <h1 className="landing-hero-h1 mb-4 text-[44px] font-semibold leading-tight text-texte-principal">
        La musique guinéenne
        <br />
        <em className="font-normal not-italic text-vert-energie">mérite sa plateforme</em>
      </h1>

      <p className="mx-auto mb-9 max-w-[500px] text-base leading-relaxed text-white/50">
        SONAFRIK rémunère directement les artistes. Chaque écoute compte.
        Rejoignez la communauté qui débloque le lancement.
      </p>

      <div className="mb-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/auth/connexion"
          className="inline-block rounded-lg bg-vert-energie px-7 py-3.5 text-[15px] font-semibold text-noir-profond no-underline"
        >
          Commencer maintenant
        </Link>
        <Link
          href="#comment-ca-marche"
          className="inline-block rounded-lg border border-white/20 bg-transparent px-7 py-3.5 text-[15px] font-medium text-texte-principal no-underline"
        >
          En savoir plus
        </Link>
      </div>

      <LandingSearchBar />

      <p className="mt-3 text-xs text-white/30">Gratuit · Aucune carte requise · 2 minutes</p>

      {children}
    </section>
  );
}
