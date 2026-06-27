interface LancementHeroStatsProps {
  artistCount: number;
  trackCount: number;
}

export function LancementHeroStats({ artistCount, trackCount }: LancementHeroStatsProps) {
  if (artistCount === 0 && trackCount === 0) return null;

  const stats = [
    { value: artistCount, label: "Artistes", icon: "🎤", show: artistCount > 0 },
    { value: trackCount, label: "Morceaux", icon: "🎵", show: trackCount > 0 },
  ].filter((s) => s.show);

  return (
    <div className="lancement-hero-stats" aria-label="Statistiques catalogue">
      {stats.map((stat) => (
        <div key={stat.label} className="lancement-hero-stat-item">
          <span className="lancement-hero-stat-icon" aria-hidden="true">
            {stat.icon}
          </span>
          <span className="lancement-hero-stat-value">{stat.value.toLocaleString("fr-FR")}</span>
          <span className="lancement-hero-stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
