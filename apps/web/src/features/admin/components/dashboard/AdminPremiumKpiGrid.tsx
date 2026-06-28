import Link from "next/link";
import type { AdminPremiumKpiView } from "../../lib/buildAdminDashboardView";
import { AdminSparkline } from "./AdminSparkline";

function AdminPremiumKpiCard({ kpi }: { kpi: AdminPremiumKpiView }) {
  const cardClass = kpi.alert
    ? "admin-human-kpi-card admin-human-kpi-card--alert"
    : "admin-human-kpi-card";

  return (
    <Link href={kpi.href} className={cardClass}>
      <div className="admin-human-kpi-card__top">
        <span className="admin-human-kpi-card__icon" aria-hidden="true">
          {kpi.icon}
        </span>
        <AdminSparkline values={kpi.sparkline} trend={kpi.trend} />
      </div>
      <p
        className="admin-human-kpi-card__value"
        style={kpi.alert ? { color: "var(--color-admin-warning)" } : undefined}
      >
        {kpi.value}
      </p>
      <p className="admin-human-kpi-card__title">{kpi.title}</p>
      <p
        className="admin-human-kpi-card__today"
        style={kpi.alert ? { color: "var(--color-admin-warning)" } : undefined}
      >
        {kpi.todayLabel}
      </p>
      <p className="admin-human-kpi-card__period">{kpi.periodLabel}</p>
      <p className={`admin-human-kpi-card__insight admin-human-kpi-card__insight--${kpi.trend}`}>
        {kpi.humanInsight}
      </p>
      {kpi.actionLabel ? (
        <span className="admin-kpi-action-link">{kpi.actionLabel}</span>
      ) : null}
    </Link>
  );
}

export function AdminPremiumKpiGrid({ kpis }: { kpis: AdminPremiumKpiView[] }) {
  return (
    <section className="admin-human-kpis" aria-labelledby="admin-kpis-title">
      <div className="admin-human-section-head">
        <h2 id="admin-kpis-title" className="admin-human-section-title">
          Pulse de la plateforme
        </h2>
        <p className="admin-human-section-sub">Chaque chiffre raconte ce que vit SONAFRIK aujourd&apos;hui</p>
      </div>
      <div className="admin-human-kpi-grid">
        {kpis.map((kpi) => (
          <AdminPremiumKpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </section>
  );
}
