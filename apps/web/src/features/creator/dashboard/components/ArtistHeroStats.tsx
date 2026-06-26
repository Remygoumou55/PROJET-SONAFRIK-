import type { CreatorDashboardKpi } from "@sonafrik/types";

interface ArtistHeroStatsProps {
  kpis: CreatorDashboardKpi[];
}

export function ArtistHeroStats({ kpis }: ArtistHeroStatsProps) {
  const highlights = kpis.filter((k) =>
    ["today_streams", "followers", "tracks"].includes(k.id),
  ).slice(0, 3);

  if (highlights.length === 0) return null;

  return (
    <aside className="artist-hero__stats" aria-label="Statistiques clés">
      <h2 className="artist-hero__stats-title">En un coup d&apos;œil</h2>
      <ul className="artist-hero__stats-list">
        {highlights.map((kpi) => (
          <li key={kpi.id} className="artist-hero__stat">
            <span className="artist-hero__stat-icon" aria-hidden="true">
              {kpi.icon}
            </span>
            <div>
              <p className="artist-hero__stat-value">{kpi.value}</p>
              <p className="artist-hero__stat-label">{kpi.label}</p>
              {kpi.insight ? <p className="artist-hero__stat-insight">{kpi.insight}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
