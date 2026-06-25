import { PlayerMockup } from "./PlayerMockup";
import { LandingSectionHeader } from "./LandingSectionHeader";
import type { LandingArtistsSection } from "@sonafrik/types";

const STEPS = [
  {
    number: "1",
    title: "Créez votre compte",
    body: "Artiste ou auditeur — deux minutes, votre numéro guinéen suffit.",
  },
  {
    number: "2",
    title: "Choisissez votre formule",
    body: "Journalier, mensuel ou annuel — payez via Orange Money ou MTN MoMo.",
  },
  {
    number: "3",
    title: "Écoutez ou publiez",
    body: "Chaque écoute génère des royalties. Les artistes retirent sur mobile money.",
  },
] as const;

const HIGHLIGHTS = [
  "Écoute fluide en 3G — économie de données intégrée",
  "65 % des abonnements reversés aux artistes écoutés",
  "Pourboires et Beat Store — soutien direct aux créateurs",
] as const;

interface LandingHowItWorksProps {
  featuredTrack?: LandingArtistsSection["featuredTrack"];
}

export function LandingHowItWorks({ featuredTrack }: LandingHowItWorksProps) {
  return (
    <section id="comment-ca-marche" className="mb-14 scroll-mt-[88px]">
      <LandingSectionHeader
        label="APERÇU"
        title="Une vraie expérience musicale, pensée pour toi"
        subtitle="Voici SONAFRIK — interface réelle, pas une promesse."
      />

      <div className="landing-how-grid">
        <div className="landing-how-mockup">
          <PlayerMockup featuredTrack={featuredTrack} />
        </div>

        <div className="landing-how-steps">
          {STEPS.map(({ number, title, body }, index) => (
            <div
              key={number}
              className={`landing-how-step flex items-start gap-4 ${index < STEPS.length - 1 ? "mb-6" : ""}`}
            >
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  index === 0
                    ? "bg-vert-energie text-noir-profond"
                    : "border border-bordure bg-surface text-texte-principal"
                }`}
              >
                {number}
              </div>
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-texte-principal">{title}</h3>
                <p className="m-0 text-sm leading-relaxed text-texte-secondaire">{body}</p>
              </div>
            </div>
          ))}

          <ul className="mt-5 flex list-none flex-col gap-3 border-t border-bordure p-0 pt-5">
            {HIGHLIGHTS.map((text) => (
              <li key={text} className="flex gap-2.5 text-sm leading-snug text-white/65">
                <span className="font-bold text-vert-energie">✓</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
