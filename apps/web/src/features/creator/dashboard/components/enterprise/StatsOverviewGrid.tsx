"use client";

import { memo } from "react";
import type { CreatorDashboardKpi, StreamTimelineEntry } from "@sonafrik/types";
import { SparklineChart } from "../SparklineChart";
import { buildStatCards } from "@sonafrik/api/creator";

interface StatsOverviewGridProps {
  kpis: CreatorDashboardKpi[];
  timeline: StreamTimelineEntry[];
}

function StatsOverviewGridView({ kpis, timeline }: StatsOverviewGridProps) {
  const cards = buildStatCards(kpis, timeline);

  return (
    <section className="dash-stats" aria-label="Statistiques">
      <h2 className="dash-section-title">Statistiques</h2>
      <div className="dash-stats__grid">
        {cards.map((card) => (
          <article key={card.id} className={`dash-stats__card dash-stats__card--${card.trend}`}>
            <div className="dash-stats__head">
              <span className="dash-stats__icon" aria-hidden="true">
                {card.icon}
              </span>
              <p className="dash-stats__label">{card.label}</p>
            </div>
            <p className="dash-stats__value">{card.value}</p>
            <p className="dash-stats__hint">{card.hint}</p>
            {card.sparkline && card.sparkline.length > 0 ? (
              <div className="dash-stats__spark">
                <SparklineChart entries={card.sparkline} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export const StatsOverviewGrid = memo(StatsOverviewGridView);
