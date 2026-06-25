"use client";

import Link from "next/link";
import type { CreatorMonthlyRevenuePoint, CreatorRevenueStats } from "@sonafrik/types";
import { MonthlySparkline } from "./MonthlySparkline";

function fmtGnf(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

interface RevenueSectionProps {
  revenue: CreatorRevenueStats;
  monthlyRevenue: CreatorMonthlyRevenuePoint[];
  revenueProjectionGnf: number | null;
}

export function RevenueSection({
  revenue,
  monthlyRevenue,
  revenueProjectionGnf,
}: RevenueSectionProps) {
  const hasData =
    revenue.wallet_balance_gnf > 0 ||
    revenue.estimated_monthly_gnf > 0 ||
    revenue.total_royalties_gnf > 0;

  if (!hasData) {
    return (
      <section className="creator-widget creator-revenue">
        <h2 className="creator-widget__title">Vos revenus</h2>
        <div className="creator-empty creator-revenue__empty">
          <p className="creator-empty__emoji creator-revenue__empty-icon" aria-hidden="true">
            💰
          </p>
          <p className="creator-empty__title">Vos revenus naissent avec vos écoutes</p>
          <p className="creator-empty__text">
            65 % de chaque écoute comptabilisée vous revient.
            Publiez votre premier morceau pour commencer à gagner.
          </p>
          <Link href="/wallet/payout" className="creator-empty__cta">
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
        <Link href="/wallet/royalties" className="creator-revenue__link">
          Voir le détail →
        </Link>
      </div>

      <div className="creator-revenue__columns">
        <div className="creator-revenue__stat">
          <span>Revenus ce mois</span>
          <strong>{fmtGnf(revenue.estimated_monthly_gnf)}</strong>
        </div>
        <div className="creator-revenue__stat">
          <span>Total cumulé</span>
          <strong>{fmtGnf(revenue.total_royalties_gnf)}</strong>
        </div>
        <div className="creator-revenue__stat">
          <span>Disponible</span>
          <strong>{fmtGnf(revenue.wallet_balance_gnf)}</strong>
        </div>
      </div>

      {monthlyRevenue.length > 0 ? (
        <div className="creator-revenue__chart">
          <p className="creator-revenue__chart-label">Évolution sur 6 mois</p>
          <MonthlySparkline points={monthlyRevenue} />
        </div>
      ) : null}

      {revenueProjectionGnf !== null && revenueProjectionGnf > 0 ? (
        <div className="creator-revenue__projection">
          <p className="creator-revenue__projection-label">À ce rythme, vous pourriez gagner</p>
          <p className="creator-revenue__projection-value">{fmtGnf(revenueProjectionGnf)} / mois</p>
          <p className="creator-revenue__projection-disclaimer">
            * Estimation basée sur vos écoutes de cette semaine
          </p>
        </div>
      ) : null}
    </section>
  );
}
