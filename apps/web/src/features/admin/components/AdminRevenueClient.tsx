"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminRevenueDashboardData } from "@sonafrik/api/admin";
import type { RoyaltyCycleStatus } from "@sonafrik/types";
import { formatGnf } from "@sonafrik/shared";
import { AdminRevenueChart } from "./AdminRevenueChart";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { triggerRoyaltyCycleAction } from "../actions/admin.actions";

type RevenueTab = "monthly" | "artists" | "types" | "cycles";

const REVENUE_REASON_LABELS: Record<string, string> = {
  subscription: "Abonnements",
  tip: "Pourboires (brut)",
  commission: "Commission SONAFRIK (pourboires 5%)",
  beat_purchase: "Beat Store (achats)",
  beat_sale: "Beat Store (ventes)",
  royalty: "Royalties versées",
  topup: "Recharges wallet",
  refund: "Remboursements",
  withdrawal: "Retraits",
};

const CYCLE_STATUS_LABELS: Record<RoyaltyCycleStatus, string> = {
  open: "Ouvert",
  calculating: "Calcul en cours",
  ready: "Prêt à distribuer",
  distributed: "Distribué",
  closed: "Clôturé",
};

function monthStartIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  data: AdminRevenueDashboardData;
}

export function AdminRevenueClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<RevenueTab>("monthly");
  const [showCycleConfirm, setShowCycleConfirm] = useState(false);
  const [isTriggeringCycle, setIsTriggeringCycle] = useState(false);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [cycleSuccess, setCycleSuccess] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const revenueChangeNum = data.revenueChange ? parseFloat(data.revenueChange) : null;
  const trendClass =
    revenueChangeNum === null
      ? "admin-kpi-trend--neutral"
      : revenueChangeNum >= 0
        ? "admin-kpi-trend--up"
        : "admin-kpi-trend--down";

  const handleTriggerCycle = async () => {
    setIsTriggeringCycle(true);
    setCycleError(null);
    setCycleSuccess(null);

    const result = await triggerRoyaltyCycleAction({
      periodStart: monthStartIso(),
      periodEnd: todayIso(),
      totalRevenueGnf: Math.max(data.thisMonthTotal, 1000),
      revenuePoolPercent: 65,
    });

    setIsTriggeringCycle(false);
    setShowCycleConfirm(false);

    if (result.error) {
      setCycleError(result.error);
      return;
    }

    setCycleSuccess(
      `Cycle déclenché — ${result.artistCount ?? 0} artiste(s), ${formatGnf(result.totalDistributed ?? 0)} distribués.`,
    );
    startTransition(() => router.refresh());
  };

  const typeTotal = Object.values(data.revenueByType).reduce((sum, value) => sum + value, 0);

  return (
    <div className="admin-dashboard admin-revenue-module">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Revenus</h1>
          <p className="admin-page-sub">Historique financier complet de la plateforme</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-sm"
          onClick={() => window.print()}
        >
          Exporter PDF
        </button>
      </div>

      {data.alerts.cycleOverdue && (
        <div className="admin-alerts-bar admin-alerts-bar--warning">
          <span className="admin-alerts-icon" aria-hidden>
            🟠
          </span>
          <span className="admin-alerts-text">
            Dernier cycle royalties il y a <strong>{data.alerts.daysSinceLastCycle} jours</strong>.
            Il est recommandé de déclencher un nouveau cycle.
          </span>
          <button
            type="button"
            className="admin-btn admin-btn-primary admin-btn-sm admin-alerts-action"
            onClick={() => setShowCycleConfirm(true)}
            disabled={isTriggeringCycle}
          >
            {isTriggeringCycle ? "Déclenchement…" : "Déclencher maintenant"}
          </button>
        </div>
      )}

      {data.alerts.negativeBalanceCount > 0 && (
        <div className="admin-alerts-bar admin-alerts-bar--danger">
          <span className="admin-alerts-icon" aria-hidden>
            🔴
          </span>
          <span className="admin-alerts-text">
            {data.alerts.negativeBalanceCount} wallet(s) avec solde négatif — vérification urgente.
          </span>
        </div>
      )}

      <div className="admin-kpis-grid admin-kpis-grid--3">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>
              💰
            </span>
            <span className={`admin-kpi-trend ${trendClass}`}>
              {data.revenueChange
                ? `${revenueChangeNum !== null && revenueChangeNum >= 0 ? "+" : ""}${data.revenueChange}%`
                : "—"}
            </span>
          </div>
          <p className="admin-kpi-value">{formatGnf(data.thisMonthTotal)}</p>
          <p className="admin-kpi-title">Revenus ce mois</p>
          <p className="admin-kpi-sub">vs {formatGnf(data.lastMonthTotal)} le mois passé</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>
              🎤
            </span>
          </div>
          <p className="admin-kpi-value">{data.topArtists.length}</p>
          <p className="admin-kpi-title">Top artistes crédités</p>
          <p className="admin-kpi-sub">par revenus cumulés wallet</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>
              🔄
            </span>
          </div>
          <p className="admin-kpi-value">{data.royaltyCycles.length}</p>
          <p className="admin-kpi-title">Cycles royalties</p>
          <p className="admin-kpi-sub">
            {data.lastCycle
              ? `Dernier : ${new Date(data.lastCycle.created_at).toLocaleDateString("fr-FR")}`
              : "Aucun cycle encore"}
          </p>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Vues revenus">
        {(
          [
            ["monthly", "Mensuel"],
            ["artists", "Par artiste"],
            ["types", "Par type"],
            ["cycles", "Cycles royalties"],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`admin-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "monthly" && (
        <section className="admin-card">
          <h3 className="admin-card-title">Revenus des 12 derniers mois</h3>
          <AdminRevenueChart data={data.monthlyRevenue} />
          <div className="admin-table-wrap admin-revenue-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Mois</th>
                  <th className="admin-th">Total collecté</th>
                  <th className="admin-th">Part artistes (65%)</th>
                  <th className="admin-th">Part SONAFRIK (30%)</th>
                  <th className="admin-th">Fonds Awards (5%)</th>
                </tr>
              </thead>
              <tbody>
                {[...data.monthlyRevenue].reverse().map(({ monthKey, label, totalGnf }) => (
                  <tr key={monthKey} className="admin-tr">
                    <td className="admin-td admin-td-strong">{label}</td>
                    <td className="admin-td admin-td-success">{formatGnf(totalGnf)}</td>
                    <td className="admin-td">{formatGnf(totalGnf * 0.65)}</td>
                    <td className="admin-td">{formatGnf(totalGnf * 0.3)}</td>
                    <td className="admin-td">{formatGnf(totalGnf * 0.05)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "artists" && (
        <section className="admin-card">
          <h3 className="admin-card-title">Top artistes par revenus</h3>
          {data.topArtists.length === 0 ? (
            <p className="admin-empty-state__text">Aucun crédit wallet enregistré.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">#</th>
                    <th className="admin-th">Artiste</th>
                    <th className="admin-th">Revenus totaux</th>
                    <th className="admin-th">Solde actuel</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topArtists.map((artist, index) => (
                    <tr key={artist.userId} className="admin-tr">
                      <td className="admin-td">
                        <span className={index < 3 ? "admin-rank-medal" : "admin-rank-num"}>
                          {index < 3 ? ["🥇", "🥈", "🥉"][index] : `#${index + 1}`}
                        </span>
                      </td>
                      <td className="admin-td admin-td-strong">{artist.artistName}</td>
                      <td className="admin-td admin-td-success">{formatGnf(artist.totalEarnedGnf)}</td>
                      <td className="admin-td">{formatGnf(artist.balanceGnf)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "types" && (
        <section className="admin-card">
          <h3 className="admin-card-title">Revenus par type — ce mois</h3>
          {Object.keys(data.revenueByType).length === 0 ? (
            <p className="admin-empty-state__text">Aucune transaction ce mois.</p>
          ) : (
            <div className="revenue-types-list">
              {Object.entries(data.revenueByType)
                .sort(([, a], [, b]) => b - a)
                .map(([reason, amount]) => {
                  const pct = typeTotal > 0 ? ((amount / typeTotal) * 100).toFixed(1) : "0";
                  const isCommission = reason === "commission";
                  return (
                    <div key={reason} className="revenue-type-row">
                      <div className="revenue-type-info">
                        <p className="revenue-type-label">
                          {REVENUE_REASON_LABELS[reason] ?? reason}
                        </p>
                        <p
                          className={`revenue-type-amount ${isCommission ? "revenue-type-amount--commission" : ""}`}
                        >
                          {formatGnf(amount)}
                        </p>
                      </div>
                      <div className="revenue-type-bar-wrap">
                        <div className="revenue-type-bar">
                          <div className="revenue-type-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="revenue-type-pct">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      )}

      {activeTab === "cycles" && (
        <section className="admin-card">
          <div className="admin-card-header-row">
            <h3 className="admin-card-title">Historique des cycles royalties</h3>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => setShowCycleConfirm(true)}
              disabled={isTriggeringCycle}
            >
              {isTriggeringCycle ? "Déclenchement…" : "Déclencher un cycle"}
            </button>
          </div>

          {cycleError && (
            <p className="admin-inline-alert admin-inline-alert--error">{cycleError}</p>
          )}
          {cycleSuccess && (
            <p className="admin-inline-alert admin-inline-alert--success">{cycleSuccess}</p>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Période</th>
                  <th className="admin-th">Statut</th>
                  <th className="admin-th">Pool distribué</th>
                  <th className="admin-th">Artistes payés</th>
                  <th className="admin-th">Revenus totaux</th>
                </tr>
              </thead>
              <tbody>
                {data.royaltyCycles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-td-empty">
                      Aucun cycle déclenché.
                    </td>
                  </tr>
                ) : (
                  data.royaltyCycles.map((cycle) => (
                    <tr key={cycle.id} className="admin-tr">
                      <td className="admin-td">
                        {cycle.period_start} → {cycle.period_end}
                      </td>
                      <td className="admin-td">
                        <span className="admin-status-badge badge-info">
                          {CYCLE_STATUS_LABELS[cycle.status] ?? cycle.status}
                        </span>
                      </td>
                      <td className="admin-td admin-td-success">{formatGnf(cycle.revenue_pool_gnf)}</td>
                      <td className="admin-td">{cycle.artist_count}</td>
                      <td className="admin-td">{formatGnf(cycle.total_revenue_gnf)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AdminConfirmModal
        isOpen={showCycleConfirm}
        title="Déclencher un cycle royalties"
        description={`Vous allez ouvrir, calculer et distribuer un cycle sur la période ${monthStartIso()} → ${todayIso()} avec un revenu total de ${formatGnf(Math.max(data.thisMonthTotal, 1000))} (65% pool artistes).`}
        confirmText="DECLENCHER"
        confirmLabel="Confirmer le cycle"
        isDanger={false}
        onConfirm={handleTriggerCycle}
        onCancel={() => setShowCycleConfirm(false)}
      />
    </div>
  );
}
