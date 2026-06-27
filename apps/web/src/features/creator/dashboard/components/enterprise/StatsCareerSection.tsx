"use client";

import { memo } from "react";
import type { CreatorCareerOsState, CreatorDashboardKpi, StreamTimelineEntry } from "@sonafrik/types";
import { SparklineChart } from "../SparklineChart";
import { CareerLevelCompact } from "./CareerLevelCompact";
import { buildStatCards } from "@sonafrik/api/creator/presentation";

interface StatsCareerSectionProps {
  kpis: CreatorDashboardKpi[];
  timeline: StreamTimelineEntry[];
  careerOs: CreatorCareerOsState;
}

function StatsCareerSectionView({ kpis, timeline, careerOs }: StatsCareerSectionProps) {
  const cards = buildStatCards(kpis, timeline);

  return (
    <section className="dash-stats-career" aria-label="Statistiques et niveau de carrière">
      <h2 className="dash-section-title">Statistiques</h2>
      <div className="dash-stats-career__grid">
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
        <CareerLevelCompact careerOs={careerOs} />
      </div>
    </section>
  );
}

export const StatsCareerSection = memo(StatsCareerSectionView);
