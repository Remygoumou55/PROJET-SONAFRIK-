import Link from "next/link";
import type { AdminCockpitData } from "@sonafrik/api/admin";
import { ADMIN_MODULE_CARDS } from "../lib/admin-nav";
import { AdminRevenueChart } from "./AdminRevenueChart";

function fmtGnf(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M GNF`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k GNF`;
  return `${amount.toLocaleString("fr-FR")} GNF`;
}

interface AdminKPICardProps {
  title: string;
  value: string;
  sub: string;
  icon: string;
  trend: "up" | "down" | "neutral";
  href: string;
}

function AdminKPICard({ title, value, sub, icon, trend, href }: AdminKPICardProps) {
  return (
    <Link href={href} className="admin-kpi-card">
      <div className="admin-kpi-header">
        <span className="admin-kpi-icon" aria-hidden="true">
          {icon}
        </span>
        <span className={`admin-kpi-trend admin-kpi-trend--${trend}`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
        </span>
      </div>
      <p className="admin-kpi-value">{value}</p>
      <p className="admin-kpi-title">{title}</p>
      <p className="admin-kpi-sub">{sub}</p>
    </Link>
  );
}

interface AdminCockpitDashboardProps {
  data: AdminCockpitData;
}

export function AdminCockpitDashboard({ data }: AdminCockpitDashboardProps) {
  const { kpis, alerts, recentActivity, monthlyRevenue } = data;

  const totalAlerts =
    alerts.pendingSignalements + alerts.pendingWithdrawals + alerts.pendingArtistVerif;
  const hasCriticalAlerts = totalAlerts > 0;

  const premiumRate =
    kpis.totalUsers > 0 ? ((kpis.premiumUsers / kpis.totalUsers) * 100).toFixed(1) : "0.0";

  const revenueTrend =
    kpis.revenueChange && parseFloat(kpis.revenueChange) >= 0 ? "up" : "down";

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-sub">Vue d&apos;ensemble de la plateforme SONAFRIK</p>
      </div>

      {hasCriticalAlerts ? (
        <div className="admin-alerts-bar" role="alert">
          <span className="admin-alerts-icon" aria-hidden="true">
            🔴
          </span>
          <span className="admin-alerts-text">
            {totalAlerts} élément{totalAlerts > 1 ? "s" : ""} nécessitant votre attention :
          </span>
          <div className="admin-alerts-items">
            {alerts.pendingSignalements > 0 ? (
              <Link href="/admin/moderation" className="admin-alert-chip admin-alert-chip--danger">
                {alerts.pendingSignalements} signalement{alerts.pendingSignalements > 1 ? "s" : ""}
              </Link>
            ) : null}
            {alerts.pendingWithdrawals > 0 ? (
              <Link href="/admin/withdrawals" className="admin-alert-chip admin-alert-chip--warning">
                {alerts.pendingWithdrawals} retrait{alerts.pendingWithdrawals > 1 ? "s" : ""} en attente
              </Link>
            ) : null}
            {alerts.pendingArtistVerif > 0 ? (
              <Link href="/admin/artists?filter=pending" className="admin-alert-chip admin-alert-chip--info">
                {alerts.pendingArtistVerif} artiste{alerts.pendingArtistVerif > 1 ? "s" : ""} à vérifier
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="admin-kpis-grid">
        <AdminKPICard
          title="Utilisateurs totaux"
          value={kpis.totalUsers.toLocaleString("fr-FR")}
          sub={`+${kpis.newUsersToday} aujourd'hui`}
          icon="👥"
          trend="up"
          href="/admin/users"
        />
        <AdminKPICard
          title="Abonnements payants"
          value={kpis.premiumUsers.toLocaleString("fr-FR")}
          sub={`${premiumRate}% des utilisateurs`}
          icon="💳"
          trend="up"
          href="/admin/users?filter=premium"
        />
        <AdminKPICard
          title="Artistes actifs"
          value={kpis.activeArtists.toLocaleString("fr-FR")}
          sub={`+${kpis.newArtistsThisWeek} cette semaine`}
          icon="🎤"
          trend="up"
          href="/admin/artists"
        />
        <AdminKPICard
          title="Revenus du mois"
          value={fmtGnf(kpis.revenueThisMonth)}
          sub={
            kpis.revenueChange
              ? `${parseFloat(kpis.revenueChange) >= 0 ? "+" : ""}${kpis.revenueChange}% vs mois passé`
              : "Premier mois"
          }
          icon="💰"
          trend={kpis.revenueChange ? revenueTrend : "neutral"}
          href="/admin/finance"
        />
      </div>

      <section className="admin-chart-section">
        <h2 className="admin-section-title">Revenus wallet — 12 derniers mois</h2>
        <AdminRevenueChart data={monthlyRevenue} />
      </section>

      <section className="admin-modules-section">
        <h2 className="admin-section-title">Modules de gestion</h2>
        <div className="admin-modules-grid">
          {ADMIN_MODULE_CARDS.map((mod) => (
            <Link key={mod.href} href={mod.href} className="admin-module-card">
              <span className="admin-module-icon" aria-hidden="true">
                {mod.icon}
              </span>
              <div className="admin-module-info">
                <p className="admin-module-name">{mod.label}</p>
                <p className="admin-module-desc">{mod.desc}</p>
              </div>
              <span className="admin-module-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-activity-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Activité récente</h2>
          <Link href="/admin/audit" className="admin-section-link">
            Voir tout →
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="admin-empty">Aucune activité récente.</p>
        ) : (
          <div className="admin-activity-list">
            {recentActivity.map((item) => (
              <div key={item.id} className="admin-activity-item">
                <span className="admin-activity-dot" aria-hidden="true" />
                <span className="admin-activity-text">{item.action}</span>
                <span className="admin-activity-time">
                  {new Date(item.created_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
