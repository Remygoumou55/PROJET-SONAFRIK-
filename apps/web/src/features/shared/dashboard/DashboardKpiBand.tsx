import type { DashboardKpiTileView } from "@sonafrik/api/creator/presentation";

interface DashboardKpiBandProps {
  items: DashboardKpiTileView[];
}

function trendSymbol(trend: DashboardKpiTileView["trend"]): string | null {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return null;
}

/** Bandeau KPI horizontal — 4 tuiles compactes, lisibles, sans titre de section. */
export function DashboardKpiBand({ items }: DashboardKpiBandProps) {
  return (
    <section className="dashboard-kpi-band" aria-label="Indicateurs clés">
      <div className="dashboard-kpi-band__row" role="list">
        {items.map((item, index) => {
          const symbol = trendSymbol(item.trend);
          return (
            <article
              key={item.id}
              className={`dashboard-kpi-band__tile dashboard-kpi-band__tile--${item.trend}`}
              style={{ animationDelay: `${index * 55}ms` }}
              role="listitem"
              aria-label={`${item.label} : ${item.value}`}
            >
              <span className="dashboard-kpi-band__icon" aria-hidden="true">
                {item.icon}
              </span>
              <p className="dashboard-kpi-band__value">{item.value}</p>
              <p className="dashboard-kpi-band__label">{item.label}</p>
              {item.delta ? (
                <p className="dashboard-kpi-band__delta">
                  {symbol ? (
                    <span className="dashboard-kpi-band__trend" aria-hidden="true">
                      {symbol}{" "}
                    </span>
                  ) : null}
                  {item.delta}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
