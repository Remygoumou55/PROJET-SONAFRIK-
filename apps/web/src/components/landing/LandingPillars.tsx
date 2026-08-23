import { LandingSectionHeader } from "./LandingSectionHeader";
import { RoyaltiesCounter } from "./RoyaltiesCounter";

const PILLARS = [
  {
    iconBg: "bg-[var(--t8-primary-lavender)]/15",
    icon: "🎵",
    title: "65 % des abonnements pour les artistes",
    body: "Sur chaque abonnement payé, 65 francs sur 100 sont reversés aux artistes — répartis entre eux selon le nombre d'écoutes réelles.",
    note: "Plus votre musique est écoutée, plus votre part est grande. Chaque auditeur contribue à tous les artistes qu'il écoute.",
  },
  {
    iconBg: "bg-[var(--t8-primary-lavender)]/15",
    icon: "🎹",
    title: "Beat Store sans commission",
    body: "Les beatmakers vendent leurs instrumentaux directement sur SONAFRIK, car ils doivent aussi vivre de leur passion et de leurs œuvres.",
    note: "Zéro frais prélevés. Ce que l'acheteur paie vous revient intégralement.",
  },
  {
    iconBg: "bg-feature-azure/15",
    icon: "💸",
    title: "Pourboires directs aux artistes",
    body: "Quand un fan vous envoie un pourboire, la quasi-totalité lui arrive directement. Le geste du fan devient immédiatement de l'argent pour vous.",
    note: "Pas de délai, pas d'écran intermédiaire. Le geste du fan devient immédiatement de l'argent pour vous.",
  },
] as const;

export function LandingPillars() {
  return (
    <section className="mb-14">
      <LandingSectionHeader label="POUR LES ARTISTES" title="Construit pour les artistes guinéens" />

      <RoyaltiesCounter />

      <div className="mx-auto mb-8 max-w-[600px] text-center">
        <p className="m-0 text-[17px] font-semibold text-[var(--t8-pearl)]">
          En Guinée, des artistes talentueux créent chaque jour — et ne gagnent presque rien.
        </p>
        <p className="mb-0 mt-2.5 text-[15px] text-white/45">
          SONAFRIK est né pour changer ça...
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
        {PILLARS.map(({ iconBg, icon, title, body, note }) => (
          <div
            key={title}
            className="rounded-[14px] border border-white/10 bg-white/[0.03] p-[22px]"
          >
            <div
              className={`mb-3.5 inline-flex size-10 items-center justify-center rounded-[10px] text-xl ${iconBg}`}
            >
              {icon}
            </div>
            <h3 className="mb-2 text-[15px] font-semibold text-[var(--t8-pearl)]">{title}</h3>
            <p className="mb-2.5 text-[13px] leading-relaxed text-white/50">{body}</p>
            <p className="mb-0 mt-2.5 border-t border-white/[0.06] pt-2.5 text-[11px] leading-snug text-white/30">
              {note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
