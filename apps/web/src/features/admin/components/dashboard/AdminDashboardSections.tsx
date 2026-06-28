import Link from "next/link";
import type { AdminModuleHumanView } from "../../lib/buildAdminDashboardView";
import { AdminRevenueChart } from "../AdminRevenueChart";
import type { AdminMonthlyRevenue } from "@sonafrik/api/admin";

export function AdminModulesHumanGrid({ modules }: { modules: AdminModuleHumanView[] }) {
  return (
    <section className="admin-human-modules" aria-labelledby="admin-modules-title">
      <h2 id="admin-modules-title" className="admin-human-section-title">
        Vos espaces de gestion
      </h2>
      <p className="admin-human-section-sub">Entrez dans chaque domaine de la plateforme</p>
      <div className="admin-human-modules__grid">
        {modules.map((mod) => (
          <Link key={mod.href} href={mod.href} className="admin-human-module-card">
            <div className="admin-human-module-card__head">
              <span className="admin-human-module-card__icon" aria-hidden="true">
                {mod.icon}
              </span>
              <span className={`admin-human-module-card__status admin-human-module-card__status--${mod.status}`}>
                {mod.status === "live" ? "Live" : mod.status === "attention" ? "Action" : "OK"}
              </span>
            </div>
            <p className="admin-human-module-card__title">{mod.label}</p>
            <p className="admin-human-module-card__desc">{mod.desc}</p>
            <p className="admin-human-module-card__stat">{mod.stat}</p>
            <p className="admin-human-module-card__activity">{mod.activity}</p>
            <span className="admin-human-module-card__enter">Entrer →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function AdminStoryChartsSection({
  monthlyRevenue,
  narrative,
}: {
  monthlyRevenue: AdminMonthlyRevenue[];
  narrative: string;
}) {
  return (
    <section className="admin-human-charts" aria-labelledby="admin-charts-title">
      <h2 id="admin-charts-title" className="admin-human-section-title">
        L&apos;histoire des revenus
      </h2>
      <p className="admin-human-section-sub">{narrative}</p>
      <p className="admin-human-chart-caption">
        Évolution des crédits artistes sur les 12 derniers mois — chaque barre représente l&apos;argent
        redistribué aux créateurs guinéens.
      </p>
      <AdminRevenueChart data={monthlyRevenue} />
    </section>
  );
}

export function AdminMusicalTodaySection({
  musical,
}: {
  musical: {
    topTrack: string | null;
    publishedCount: number;
    validListens: number;
    dominantRegion: string;
    narrative: string;
  };
}) {
  return (
    <section className="admin-human-musical" aria-labelledby="admin-musical-title">
      <h2 id="admin-musical-title" className="admin-human-section-title">
        Aujourd&apos;hui sur SONAFRIK
      </h2>
      <p className="admin-human-section-sub">{musical.narrative}</p>
      <div className="admin-human-musical__grid">
        <article className="admin-human-musical__card admin-human-musical__card--gold">
          <span className="admin-human-musical__label">🇬🇳 Guinée</span>
          <p className="admin-human-musical__value">{musical.dominantRegion}</p>
          <p className="admin-human-musical__hint">Priorité marché · Afrique de l&apos;Ouest</p>
        </article>
        <article className="admin-human-musical__card">
          <span className="admin-human-musical__label">🎵 Morceau récent</span>
          <p className="admin-human-musical__value">
            {musical.topTrack ?? "Aucun morceau valide récent"}
          </p>
          <p className="admin-human-musical__hint">Dernière publication catalogue</p>
        </article>
        <article className="admin-human-musical__card">
          <span className="admin-human-musical__label">📀 Catalogue</span>
          <p className="admin-human-musical__value">{musical.publishedCount.toLocaleString("fr-FR")}</p>
          <p className="admin-human-musical__hint">Œuvres disponibles</p>
        </article>
        <article className="admin-human-musical__card">
          <span className="admin-human-musical__label">🎧 Écoutes valides</span>
          <p className="admin-human-musical__value">{musical.validListens.toLocaleString("fr-FR")}</p>
          <p className="admin-human-musical__hint">90% de la durée écoutée</p>
        </article>
      </div>
    </section>
  );
}

export function AdminBusinessSection({
  business,
}: {
  business: {
    revenueChange: string | null;
    revenuePerUser: string;
    sonafrikShare: string;
    pendingWithdrawals: number;
    ledgerEntries: number;
    narrative: string;
  };
}) {
  return (
    <section className="admin-human-business" aria-labelledby="admin-business-title">
      <h2 id="admin-business-title" className="admin-human-section-title">
        Performance économique
      </h2>
      <p className="admin-human-section-sub">{business.narrative}</p>
      <div className="admin-human-business__grid">
        <div className="admin-human-business__metric">
          <span>Évolution revenus</span>
          <strong>
            {business.revenueChange
              ? `${parseFloat(business.revenueChange) >= 0 ? "+" : ""}${business.revenueChange}%`
              : "—"}
          </strong>
        </div>
        <div className="admin-human-business__metric">
          <span>Revenu / auditeur</span>
          <strong>{business.revenuePerUser}</strong>
        </div>
        <div className="admin-human-business__metric">
          <span>Part SONAFRIK</span>
          <strong>{business.sonafrikShare}</strong>
        </div>
        <div className="admin-human-business__metric">
          <span>Retraits en attente</span>
          <strong>{business.pendingWithdrawals}</strong>
        </div>
      </div>
    </section>
  );
}

export function AdminGovernanceSection({
  governance,
}: {
  governance: {
    fraudSessions: number;
    pendingClaims: number;
    pendingVerif: number;
    pendingCatalog: number;
    narrative: string;
  };
}) {
  return (
    <section className="admin-human-governance" aria-labelledby="admin-gov-title">
      <h2 id="admin-gov-title" className="admin-human-section-title">
        Plateforme sous contrôle
      </h2>
      <p className="admin-human-section-sub">{governance.narrative}</p>
      <div className="admin-human-governance__grid">
        <Link href="/admin/fraud" className="admin-human-governance__item">
          <span>Fraude & écoutes</span>
          <strong>{governance.fraudSessions}</strong>
        </Link>
        <Link href="/admin/rights" className="admin-human-governance__item">
          <span>Réclamations droits</span>
          <strong>{governance.pendingClaims}</strong>
        </Link>
        <Link href="/admin/artists" className="admin-human-governance__item">
          <span>Vérifications artistes</span>
          <strong>{governance.pendingVerif}</strong>
        </Link>
        <Link href="/admin/catalog" className="admin-human-governance__item">
          <span>Modération catalogue</span>
          <strong>{governance.pendingCatalog}</strong>
        </Link>
      </div>
    </section>
  );
}
