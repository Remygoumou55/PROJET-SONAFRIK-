import { memo } from "react";
import type { CreatorDashboardData } from "@sonafrik/types";
import { buildGlanceKpis } from "@sonafrik/api/creator/presentation";
import { DashboardSection } from "@/features/shared/dashboard";

function GlanceKpiGridView({ data }: { data: CreatorDashboardData }) {
  const items = buildGlanceKpis(data);

  return (
    <DashboardSection title="En un coup d'œil" ariaLabel="En un coup d'œil">
      <div className="dash-glance__grid">
        {items.map((item) => (
          <article
            key={item.id}
            className={`dash-glance__card dash-glance__card--${item.trend} enterprise-card`}
            aria-label={`${item.label} : ${item.value}`}
          >
            <span className="dash-glance__icon" aria-hidden="true">
              {item.icon}
            </span>
            <p className="dash-glance__value">{item.value}</p>
            <p className="dash-glance__label">{item.label}</p>
            <p className="dash-glance__sub">{item.sublabel}</p>
          </article>
        ))}
      </div>
    </DashboardSection>
  );
}

export const GlanceKpiGrid = memo(GlanceKpiGridView);
