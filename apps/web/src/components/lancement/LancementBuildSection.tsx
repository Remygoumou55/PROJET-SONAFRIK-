const BUILD_CARDS = [
  {
    icon: "🎵",
    title: "La musique guinéenne libre",
    desc: "Chaque artiste publie, chaque auditeur découvre. Sans barrières.",
  },
  {
    icon: "💰",
    title: "L'argent va aux artistes",
    desc: "65 % de chaque abonnement reversé directement aux créateurs.",
  },
  {
    icon: "🏆",
    title: "Les artistes sont reconnus",
    desc: "Awards annuels, classements, visibilité nationale et diaspora.",
  },
] as const;

export function LancementBuildSection() {
  return (
    <section className="lancement-build-section" aria-labelledby="lancement-build-title">
      <h2 id="lancement-build-title" className="lancement-build-title">
        Ce que nous construisons ensemble
      </h2>
      <p className="lancement-build-subtitle">SONAFRIK grandit avec vous</p>
      <div className="lancement-build-grid">
        {BUILD_CARDS.map((card) => (
          <article key={card.title} className="lancement-build-card">
            <span className="lancement-build-icon" aria-hidden="true">
              {card.icon}
            </span>
            <h3 className="lancement-build-card-title">{card.title}</h3>
            <p className="lancement-build-card-desc">{card.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
