import type { PeriodStreamSnapshot, PeriodTrend } from "../lib/analyticsPeriod";
import { formatListenCount } from "../lib/analyticsPeriod";
import { formatGnf } from "@sonafrik/shared";

interface KpiProps {
  streams: PeriodStreamSnapshot;
  trend: PeriodTrend;
  estimatedGnf: number;
  walletBalance: number;
  newFollowers: number;
  totalFollowers: number;
  audienceLabel: string;
}

function TrendGlyph({ direction }: { direction: PeriodTrend["direction"] }) {
  if (direction === "up") return <span className="analytics-kpi__trend analytics-kpi__trend--up" aria-hidden="true">↑</span>;
  if (direction === "down") return <span className="analytics-kpi__trend analytics-kpi__trend--down" aria-hidden="true">↓</span>;
  return <span className="analytics-kpi__trend" aria-hidden="true">→</span>;
}

export function AnalyticsSummaryKpis({
  streams,
  trend,
  estimatedGnf,
  walletBalance,
  newFollowers,
  totalFollowers,
  audienceLabel,
}: KpiProps) {
  return (
    <div className="analytics-kpis" role="list" aria-label="Indicateurs clés">
      <article className="analytics-kpi" role="listitem">
        <p className="analytics-kpi__label">Écoutes</p>
        <p className="analytics-kpi__value">{formatListenCount(streams.validListens)}</p>
        <p className="analytics-kpi__hint">{streams.label}</p>
      </article>

      <article className="analytics-kpi" role="listitem">
        <p className="analytics-kpi__label">Progression</p>
        <p className="analytics-kpi__value analytics-kpi__value--row">
          <TrendGlyph direction={trend.direction} />
          {trend.direction === "flat" ? "Stable" : `${trend.percent > 0 ? "+" : ""}${trend.percent} %`}
        </p>
        <p className="analytics-kpi__hint">{trend.label}</p>
      </article>

      <article className="analytics-kpi analytics-kpi--accent" role="listitem">
        <p className="analytics-kpi__label">Gains estimés</p>
        <p className="analytics-kpi__value">{estimatedGnf > 0 ? formatGnf(estimatedGnf) : "—"}</p>
        <p className="analytics-kpi__hint">Solde {formatGnf(walletBalance)}</p>
      </article>

      <article className="analytics-kpi" role="listitem">
        <p className="analytics-kpi__label">Audience</p>
        <p className="analytics-kpi__value">
          {newFollowers > 0 ? `+${newFollowers}` : totalFollowers.toLocaleString("fr-FR")}
        </p>
        <p className="analytics-kpi__hint">
          {newFollowers > 0 ? audienceLabel : `${totalFollowers.toLocaleString("fr-FR")} fans au total`}
        </p>
      </article>
    </div>
  );
}
