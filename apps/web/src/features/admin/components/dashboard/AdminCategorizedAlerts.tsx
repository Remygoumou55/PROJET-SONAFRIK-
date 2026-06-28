import Link from "next/link";
import type { AdminCategorizedAlert } from "../../lib/buildAdminDashboardView";

export function AdminCategorizedAlerts({ alerts }: { alerts: AdminCategorizedAlert[] }) {
  return (
    <section className="admin-alerts-categorized" aria-labelledby="admin-alerts-cat-title">
      <h2 id="admin-alerts-cat-title" className="admin-alerts-cat-title">
        ⚡ Actions requises maintenant
      </h2>
      {alerts.length === 0 ? (
        <div className="admin-alert-cat-row admin-alert-cat--success">
          <span aria-hidden="true">✅</span>
          <span className="admin-alert-cat-success-text">Tout est en ordre — aucune action requise</span>
        </div>
      ) : (
        alerts.map((alert) => (
          <div
            key={alert.id}
            className={`admin-alert-cat-row admin-alert-cat--${alert.severity}`}
          >
            <span className="admin-alert-cat-icon" aria-hidden="true">
              {alert.icon}
            </span>
            <span className="admin-alert-cat-count">{alert.count.toLocaleString("fr-FR")}</span>
            <span className="admin-alert-cat-label">{alert.label}</span>
            <Link href={alert.href} className="admin-alert-cat-cta">
              {alert.cta}
            </Link>
          </div>
        ))
      )}
    </section>
  );
}
