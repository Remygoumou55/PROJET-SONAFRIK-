import type { CreatorRevenueStats, StreamTimelineEntry } from "@sonafrik/types";
import Link from "next/link";
import { SparklineChart } from "./SparklineChart";

function fmtGnf(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

interface RevenuePremiumCardProps {
  revenue: CreatorRevenueStats;
  timeline: StreamTimelineEntry[];
}

export function RevenuePremiumCard({ revenue, timeline }: RevenuePremiumCardProps) {
  const hasData =
    revenue.wallet_balance_gnf > 0 ||
    revenue.estimated_monthly_gnf > 0 ||
    revenue.total_royalties_gnf > 0;

  if (!hasData) {
    return (
      <section className="creator-widget creator-revenue">
        <h2 className="creator-widget__title">Vos revenus</h2>
        <div className="creator-empty">
          <p className="creator-empty__emoji" aria-hidden="true">💰</p>
          <p className="creator-empty__title">Vos revenus arrivent avec vos écoutes</p>
          <p className="creator-empty__text">
            Publiez, partagez, et chaque écoute comptabilisée alimentera votre wallet.
          </p>
          <Link href="/settings/payment" className="creator-empty__cta">
            Préparer mes paiements
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="creator-widget creator-revenue" aria-label="Revenus">
      <div className="creator-revenue__header">
        <h2 className="creator-widget__title">Vos revenus</h2>
        <Link href="/wallet" className="creator-revenue__link">
          Voir wallet →
        </Link>
      </div>
      <div className="creator-revenue__grid">
        <div className="creator-revenue__stat">
          <span>Disponible</span>
          <strong>{fmtGnf(revenue.wallet_balance_gnf)}</strong>
        </div>
        <div className="creator-revenue__stat">
          <span>En attente</span>
          <strong>{fmtGnf(revenue.pending_royalties_gnf)}</strong>
        </div>
        <div className="creator-revenue__stat">
          <span>Estimé ce mois</span>
          <strong>{fmtGnf(revenue.estimated_monthly_gnf)}</strong>
        </div>
        <div className="creator-revenue__stat">
          <span>Total royalties</span>
          <strong>{fmtGnf(revenue.total_royalties_gnf)}</strong>
        </div>
      </div>
      {timeline.length > 0 ? (
        <div className="creator-revenue__chart">
          <p className="creator-revenue__chart-label">Évolution des écoutes (14 jours)</p>
          <SparklineChart entries={timeline} />
        </div>
      ) : null}
    </section>
  );
}
