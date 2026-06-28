"use client";

import { memo } from "react";
import type { AdminFraudSupervisionStats } from "@sonafrik/api/admin";

interface Props {
  stats: AdminFraudSupervisionStats;
}

function StatCell({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className={`fraud-kpi ${tone ?? ""}`}>
      <p className="fraud-kpi__value">{value.toLocaleString("fr-FR")}</p>
      <p className="fraud-kpi__label">{label}</p>
    </div>
  );
}

function FraudSupervisionDashboardView({ stats }: Props) {
  return (
    <section className="fraud-supervision-dashboard" aria-label="Résumé du jour">
      <header className="fraud-supervision-dashboard__header">
        <h2 className="fraud-supervision-dashboard__title">Centre de supervision</h2>
        <p className="fraud-supervision-dashboard__sub">Vue d&apos;ensemble — aujourd&apos;hui</p>
      </header>
      <div className="fraud-supervision-dashboard__grid">
        <StatCell label="Sessions aujourd'hui" value={stats.todayTotal} />
        <StatCell label="Sessions actives" value={stats.activeSessions} tone="fraud-kpi--live" />
        <StatCell label="Fraudes détectées" value={stats.fraudDetectedToday} tone="fraud-kpi--warn" />
        <StatCell label="Incidents critiques" value={stats.criticalIncidents} tone="fraud-kpi--critical" />
        <StatCell label="Écoutes normales" value={stats.normalSessionsToday} tone="fraud-kpi--ok" />
        <StatCell label="Comptes à surveiller" value={stats.suspendedAccountsHint} />
        <StatCell label="Écoutes valides" value={stats.validListensToday} tone="fraud-kpi--ok" />
        <StatCell label="Écoutes rejetées" value={stats.rejectedListensToday} tone="fraud-kpi--warn" />
      </div>
    </section>
  );
}

export const FraudSupervisionDashboard = memo(FraudSupervisionDashboardView);
