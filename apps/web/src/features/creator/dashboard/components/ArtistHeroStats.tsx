import { memo } from "react";
import type { CreatorDashboardKpi } from "@sonafrik/types";
import {
  getHeroHighlightAriaLabel,
  getHeroHighlightLabel,
  getHeroHighlightValue,
  selectHeroHighlightKpis,
} from "../lib/artistHeroStats.presentation";

interface ArtistHeroStatsProps {
  kpis: CreatorDashboardKpi[];
}

function ArtistHeroStatsView({ kpis }: ArtistHeroStatsProps) {
  const highlights = selectHeroHighlightKpis(kpis);

  if (highlights.length === 0) return null;

  return (
    <aside className="artist-hero__stats" aria-label="Statistiques clés">
      <h2 className="artist-hero__stats-title">En un coup d&apos;œil</h2>
      <ul className="artist-hero__stats-list">
        {highlights.map((kpi) => (
          <li key={kpi.id} className="artist-hero__stat" aria-label={getHeroHighlightAriaLabel(kpi)}>
            <span className="artist-hero__stat-icon" aria-hidden="true">
              {kpi.icon}
            </span>
            <span className="artist-hero__stat-value">{getHeroHighlightValue(kpi)}</span>
            <span className="artist-hero__stat-label">{getHeroHighlightLabel(kpi)}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export const ArtistHeroStats = memo(ArtistHeroStatsView);
