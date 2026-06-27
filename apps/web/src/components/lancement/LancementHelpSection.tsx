const HELP_BADGES = [
  "65 % aux artistes",
  "Beat Store 0 % commission",
  "Pourboires directs",
] as const;

export function LancementHelpSection() {
  return (
    <section className="lancement-help-section" aria-labelledby="lancement-help-title">
      <div className="lancement-help-inner">
        <h2 id="lancement-help-title" className="lancement-help-title">
          Une plateforme pensée pour la Guinée
        </h2>
        <p className="lancement-help-text">
          SONAFRIK rémunère directement les artistes guinéens. Chaque abonné compte pour
          débloquer le lancement officiel — et chaque écoute compte pour la carrière des
          créateurs.
        </p>
        <div className="lancement-help-badges">
          {HELP_BADGES.map((badge) => (
            <span key={badge} className="lancement-help-badge">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
