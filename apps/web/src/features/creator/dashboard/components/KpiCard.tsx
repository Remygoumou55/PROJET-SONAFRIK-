"use client";

import { useState } from "react";
import type { CreatorDashboardKpi } from "@sonafrik/types";
import { useCountUp } from "../hooks/useCountUp";
import { EmptyKPI } from "./EmptyKPI";

function formatKpiValue(kpi: CreatorDashboardKpi, animated: number): string {
  if (kpi.id === "revenue_est" || kpi.id === "wallet") {
    return `${animated.toLocaleString("fr-FR")} GNF`;
  }
  return animated.toLocaleString("fr-FR");
}

interface KpiCardProps {
  kpi: CreatorDashboardKpi;
  onCopyProfile?: () => void;
  copyFeedback?: string | null;
}

export function KpiCard({ kpi, onCopyProfile, copyFeedback }: KpiCardProps) {
  const isEmpty = kpi.numericValue === 0 && kpi.emptyState;
  const animated = useCountUp(kpi.numericValue, 1500, !isEmpty);

  const delta =
    kpi.deltaPercent !== null
      ? `${kpi.deltaPercent > 0 ? "+" : ""}${kpi.deltaPercent} %`
      : null;

  return (
    <article className={`creator-kpi creator-kpi--${kpi.trend}`}>
      <div className="creator-kpi__icon" aria-hidden="true">
        {kpi.icon}
      </div>
      <p className="creator-kpi__label">{kpi.label}</p>

      {isEmpty && kpi.emptyState ? (
        <EmptyKPI
          {...kpi.emptyState}
          onCopyProfile={onCopyProfile}
          copyProfileLabel={copyFeedback ?? kpi.emptyState.actionLabel}
        />
      ) : (
        <>
          <p className="creator-kpi__value">{formatKpiValue(kpi, animated)}</p>
          {delta ? (
            <p className="creator-kpi__delta">
              <span>{delta}</span> {kpi.deltaLabel}
            </p>
          ) : (
            <p className="creator-kpi__delta creator-kpi__delta--muted">{kpi.deltaLabel}</p>
          )}
          <p className="creator-kpi__insight">{kpi.insight}</p>
        </>
      )}
    </article>
  );
}

export function KpiGrid({
  kpis,
  profileUrl,
}: {
  kpis: CreatorDashboardKpi[];
  profileUrl: string;
}) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  function handleCopyProfile() {
    void navigator.clipboard.writeText(profileUrl).then(() => {
      setCopyFeedback("Lien copié !");
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  }

  return (
    <section className="creator-kpi-grid" aria-label="Indicateurs clés">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.id}
          kpi={kpi}
          onCopyProfile={handleCopyProfile}
          copyFeedback={copyFeedback}
        />
      ))}
    </section>
  );
}
