import Link from "next/link";
import type { AdminDashboardViewModel } from "../../lib/buildAdminDashboardView";

export function AdminCommandHero({ hero }: { hero: AdminDashboardViewModel["hero"] }) {
  const statusLabel =
    hero.platformStatus === "excellent"
      ? "Plateforme en forme"
      : hero.platformStatus === "stable"
        ? "Plateforme stable"
        : "Attention requise";

  return (
    <section className="admin-human-hero" aria-labelledby="admin-hero-title">
      <div className="admin-human-hero__glow" aria-hidden="true" />
      <div className="admin-human-hero__content">
        <p className="admin-human-hero__greeting">{hero.greeting}</p>
        <h1 id="admin-hero-title" className="admin-human-hero__headline">
          {hero.headline}
        </h1>
        <p className="admin-human-hero__narrative">{hero.narrative}</p>
      </div>
      <div className="admin-human-hero__stats">
        <div className="admin-human-hero__stat">
          <span className="admin-human-hero__stat-label">État général</span>
          <span className={`admin-human-hero__stat-value admin-human-hero__stat-value--${hero.platformStatus}`}>
            {statusLabel}
          </span>
        </div>
        <div className="admin-human-hero__stat">
          <span className="admin-human-hero__stat-label">Catégories alertes</span>
          <span className="admin-human-hero__stat-value">{hero.criticalAlerts}</span>
        </div>
        <div className="admin-human-hero__stat">
          <span className="admin-human-hero__stat-label">Actions à faire</span>
          <span className="admin-human-hero__stat-value">{hero.actionsRequired}</span>
        </div>
        <div className="admin-human-hero__stat">
          <span className="admin-human-hero__stat-label">Services</span>
          <span className="admin-human-hero__stat-value">{hero.healthSummary}</span>
        </div>
      </div>
      {hero.actionsRequired > 0 ? (
        <Link href="/admin/finance" className="admin-human-hero__cta">
          Voir les priorités du jour →
        </Link>
      ) : null}
    </section>
  );
}
