import Link from "next/link";
import type { CreatorDashboardActivity, CreatorRevenueStats } from "@sonafrik/types";
import { DashboardPanel } from "./DashboardPanel";
import { formatDashboardGnf } from "./dashboardFormat";

interface DashboardWalletCardProps {
  revenueStats: CreatorRevenueStats;
  paymentConfigured: boolean;
  activities: CreatorDashboardActivity[];
}

function resolveLastTransaction(
  activities: CreatorDashboardActivity[],
): CreatorDashboardActivity | null {
  return (
    activities.find(
      (a) =>
        !a.isFuture &&
        (a.id === "royalties" ||
          a.title.toLowerCase().includes("revenu") ||
          a.title.toLowerCase().includes("royalt")),
    ) ?? null
  );
}

/** Carte portefeuille compacte — solde, revenus, retrait et état paiement. */
export function DashboardWalletCard({
  revenueStats,
  paymentConfigured,
  activities,
}: DashboardWalletCardProps) {
  const lastTx = resolveLastTransaction(activities);
  const retirable = revenueStats.wallet_balance_gnf;
  const payoutPending = revenueStats.pending_royalties_gnf;
  const showConfigureCta = retirable <= 0 && !paymentConfigured;

  return (
    <DashboardPanel className="dashboard-panel--wallet" ariaLabel="Portefeuille">
      <div className="dash-wallet__head">
        <div className="dash-wallet__balance-inline">
          <span className="dash-wallet__balance-icon" aria-hidden="true">
            💰
          </span>
          <div className="dash-wallet__balance-copy">
            <p className="dash-wallet__balance-label">Solde</p>
            <p className="dash-wallet__balance-value">
              {formatDashboardGnf(revenueStats.wallet_balance_gnf)}
            </p>
          </div>
        </div>
        <Link href="/wallet" className="dash-wallet__link">
          Gérer →
        </Link>
      </div>

      <div className="dash-wallet__grid">
        <div className="dash-wallet__cell">
          <p className="dash-wallet__cell-label">Revenus du mois</p>
          <p className="dash-wallet__cell-value">
            {formatDashboardGnf(revenueStats.estimated_monthly_gnf)}
          </p>
        </div>
        <div className="dash-wallet__cell">
          <p className="dash-wallet__cell-label">Retirable</p>
          <p className="dash-wallet__cell-value dash-wallet__cell-value--accent">
            {formatDashboardGnf(retirable)}
          </p>
        </div>
        <div className="dash-wallet__cell">
          <p className="dash-wallet__cell-label">Paiement</p>
          <span
            className={`dash-wallet__status dash-wallet__status--${paymentConfigured ? "ok" : "pending"}`}
          >
            {paymentConfigured ? "✓ OK" : "À configurer"}
          </span>
        </div>
        <div className="dash-wallet__cell">
          <p className="dash-wallet__cell-label">Dernière transaction</p>
          {lastTx ? (
            <p className="dash-wallet__cell-value dash-wallet__cell-value--sm dash-wallet__cell-value--clip">
              {lastTx.subtitle || lastTx.title}
            </p>
          ) : (
            <p className="dash-wallet__cell-muted">—</p>
          )}
        </div>
        <div className="dash-wallet__cell">
          <p className="dash-wallet__cell-label">Prochain versement</p>
          <p className="dash-wallet__cell-value dash-wallet__cell-value--sm">
            {payoutPending > 0 ? formatDashboardGnf(payoutPending) : "Cycle mensuel"}
          </p>
        </div>
      </div>

      {retirable > 0 ? (
        <Link href="/wallet/payout" className="dash-wallet__cta">
          Retirer →
        </Link>
      ) : showConfigureCta ? (
        <Link href="/wallet/payout" className="dash-wallet__cta dash-wallet__cta--outline">
          Configurer paiements →
        </Link>
      ) : null}
    </DashboardPanel>
  );
}
