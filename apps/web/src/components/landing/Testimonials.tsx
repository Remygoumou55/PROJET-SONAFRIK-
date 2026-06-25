import { LandingSectionHeader } from "./LandingSectionHeader";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  initials: string;
  avatarClass: string;
  avatarTextClass: string;
}

/** Remplir avec les témoignages des artistes fondateurs bêta — section masquée si vide. */
const TESTIMONIALS: Testimonial[] = [];

export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="mb-14">
      <LandingSectionHeader label="TÉMOIGNAGES" title="Ils construisent SONAFRIK avec nous" />

      <div className="landing-testimonials-scroll scrollbar-hide flex gap-3.5 overflow-x-auto pb-2">
        {TESTIMONIALS.map(({ name, role, quote, initials, avatarClass, avatarTextClass }) => (
          <article
            key={name}
            className="shrink-0 basis-[min(300px,85vw)] rounded-[14px] border border-white/[0.06] bg-surface p-5"
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex size-12 items-center justify-center rounded-full text-sm font-semibold ${avatarClass} ${avatarTextClass}`}
              >
                {initials}
              </div>
              <div>
                <p className="m-0 text-sm font-semibold text-texte-principal">{name}</p>
                <p className="m-0 text-xs text-white/45">{role}</p>
              </div>
            </div>
            <p className="m-0 text-sm italic leading-relaxed text-white/65">&ldquo;{quote}&rdquo;</p>
          </article>
        ))}
      </div>
    </section>
  );
}
