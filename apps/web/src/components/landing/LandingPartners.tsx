const PARTNERS = [
  { name: "Orange Money", dotClass: "bg-provider-orange", sub: "Paiement mobile Guinée" },
  { name: "MTN MoMo", dotClass: "bg-provider-mtn", sub: "Paiement mobile Guinée" },
  { name: "Wave", dotClass: "bg-[var(--t8-primary-lavender)]", sub: "Bientôt disponible" },
] as const;

export function LandingPartners() {
  return (
    <section className="mb-14 text-center">
      <p className="mb-5 text-[11px] uppercase tracking-[1.5px] text-white/30">
        Paiements & partenaires
      </p>
      <div className="landing-partners-row flex flex-wrap justify-center gap-3">
        {PARTNERS.map(({ name, dotClass, sub }) => (
          <div
            key={name}
            className="flex min-w-[160px] items-center gap-2.5 rounded-xl border border-[var(--t8-border-default)] bg-[var(--t8-surface-01)] px-[18px] py-3"
          >
            <span className={`size-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
            <div className="text-left">
              <p className="m-0 text-[13px] font-semibold text-[var(--t8-pearl)]">{name}</p>
              <p className="m-0 text-[11px] text-[var(--t8-silver)]">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
