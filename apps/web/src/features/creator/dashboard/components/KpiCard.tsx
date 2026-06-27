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

      <div className="creator-kpi__content">
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
      </div>
    </article>
  );
}

const DASHBOARD_KPI_ORDER = ["today_streams", "followers", "tracks", "revenue_est"] as const;

function selectDashboardKpis(kpis: CreatorDashboardKpi[]): CreatorDashboardKpi[] {
  const byId = new Map(kpis.map((kpi) => [kpi.id, kpi]));
  return DASHBOARD_KPI_ORDER.map((id) => byId.get(id)).filter(
    (kpi): kpi is CreatorDashboardKpi => kpi != null,
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
  const dashboardKpis = selectDashboardKpis(kpis);

  function handleCopyProfile() {
    void navigator.clipboard.writeText(profileUrl).then(() => {
      setCopyFeedback("Lien copié !");
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  }

  return (
    <section className="creator-kpi-grid" aria-label="Indicateurs clés">
      {dashboardKpis.map((kpi) => (
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
