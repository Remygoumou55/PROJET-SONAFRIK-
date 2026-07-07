"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { StreamTimelineEntry } from "@sonafrik/types";
import type { AnalyticsPeriodId } from "../lib/analyticsPeriod";
import { filterTimelineForPeriod, type AnalyticsCustomRange } from "../lib/analyticsPeriod";

interface Props {
  entries: StreamTimelineEntry[];
  periodId: AnalyticsPeriodId;
  customRange?: AnalyticsCustomRange | null;
  periodLabel: string;
}

function formatAxisDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function AnalyticsStreamChart({ entries, periodId, customRange, periodLabel }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => filterTimelineForPeriod(entries, periodId, customRange),
    [entries, periodId, customRange],
  );

  if (filtered.length === 0) {
    return (
      <section className="analytics-chart analytics-chart--empty" aria-label="Évolution des écoutes">
        <header className="analytics-chart__header">
          <h2 className="analytics-chart__title">Évolution des écoutes</h2>
          <p className="analytics-chart__subtitle">{periodLabel}</p>
        </header>
        <p className="analytics-chart__empty">
          Pas encore d&apos;écoutes sur cette période. Chaque stream compte — continue à partager.
        </p>
      </section>
    );
  }

  const maxStreams = Math.max(...filtered.map((e) => e.streams), 1);
  const totalValid = filtered.reduce((s, e) => s + e.valid_streams, 0);
  const active = activeIndex !== null ? filtered[activeIndex] : filtered[filtered.length - 1];

  const showLabel = (i: number) =>
    i === 0 || i === filtered.length - 1 || i % Math.max(1, Math.ceil(filtered.length / 7)) === 0;

  return (
    <section className="analytics-chart" aria-label="Évolution des écoutes">
      <header className="analytics-chart__header">
        <div>
          <h2 className="analytics-chart__title">Évolution des écoutes</h2>
          <p className="analytics-chart__subtitle">{periodLabel}</p>
        </div>
        {active && (
          <div className="analytics-chart__focus" aria-live="polite">
            <span className="analytics-chart__focus-date">{formatAxisDate(active.date)}</span>
            <span className="analytics-chart__focus-value">
              {active.valid_streams.toLocaleString("fr-FR")} écoutes
            </span>
          </div>
        )}
      </header>

      <div
        className="analytics-chart__bars"
        role="img"
        aria-label={`${totalValid.toLocaleString("fr-FR")} écoutes comptabilisées sur la période`}
      >
        {filtered.map((entry, i) => {
          const totalH = Math.max(4, Math.round((entry.streams / maxStreams) * 100));
          const validH = Math.max(2, Math.round((entry.valid_streams / maxStreams) * 100));
          const isActive = activeIndex === i;

          return (
            <button
              key={entry.date}
              type="button"
              className={`analytics-chart__bar${isActive ? " analytics-chart__bar--active" : ""}`}
              style={{ "--bar-total": `${totalH}%`, "--bar-valid": `${validH}%` } as CSSProperties}
              onMouseEnter={() => setActiveIndex(i)}
              onFocus={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onBlur={() => setActiveIndex(null)}
              aria-label={`${formatAxisDate(entry.date)} : ${entry.valid_streams} écoutes comptabilisées`}
            >
              <span className="analytics-chart__bar-total" aria-hidden="true" />
              <span className="analytics-chart__bar-valid" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="analytics-chart__axis" aria-hidden="true">
        {filtered.map((entry, i) => (
          <span key={entry.date} className="analytics-chart__axis-label">
            {showLabel(i) ? formatAxisDate(entry.date) : ""}
          </span>
        ))}
      </div>

      <div className="analytics-chart__legend">
        <span><i className="analytics-chart__dot analytics-chart__dot--total" /> Toutes les écoutes</span>
        <span><i className="analytics-chart__dot analytics-chart__dot--valid" /> Comptabilisées</span>
      </div>
    </section>
  );
}
