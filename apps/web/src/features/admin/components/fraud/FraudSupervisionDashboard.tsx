"use client";

import { memo, type ReactNode } from "react";
import type { AdminFraudSupervisionStats } from "@sonafrik/api/admin";

interface Props {
  stats: AdminFraudSupervisionStats;
}

function StatCell({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number;
  tone?: string;
  suffix?: string;
}) {
  const display =
    suffix !== undefined ? `${value.toLocaleString("fr-FR")}${suffix}` : value.toLocaleString("fr-FR");
  return (
    <div className={`fraud-kpi ${tone ?? ""}`}>
      <p className="fraud-kpi__value">{display}</p>
      <p className="fraud-kpi__label">{label}</p>
    </div>
  );
}

function Zone({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className="fraud-supervision-zone" aria-label={title}>
      <header className="fraud-supervision-zone__header">
        <span className="fraud-supervision-zone__icon" aria-hidden>
          {icon}
        </span>
        <h3 className="fraud-supervision-zone__title">{title}</h3>
      </header>
      <div className="fraud-supervision-zone__grid">{children}</div>
    </section>
  );
}

function FraudSupervisionDashboardView({ stats }: Props) {
  return (
    <section className="fraud-supervision-dashboard" aria-label="Centre de supervision">
      <header className="fraud-supervision-dashboard__header">
        <h2 className="fraud-supervision-dashboard__title">Centre de supervision</h2>
        <p className="fraud-supervision-dashboard__sub">
          SSOT · {stats.totalIncidents.toLocaleString("fr-FR")} incidents ·{" "}
          {stats.flaggedToday.toLocaleString("fr-FR")} aujourd&apos;hui
        </p>
      </header>

      <div className="fraud-supervision-dashboard__zones">
        <Zone title="Santé plateforme" icon="📡">
          <StatCell label="Sessions aujourd'hui" value={stats.todayTotal} />
          <StatCell label="Sessions actives" value={stats.activeSessions} tone="fraud-kpi--live" />
          <StatCell label="Ce mois" value={stats.flaggedThisMonth} />
          <StatCell
            label="Taux réussite écoutes"
            value={stats.listenSuccessRate}
            tone="fraud-kpi--ok"
            suffix="%"
          />
        </Zone>

        <Zone title="Sécurité" icon="🛡️">
          <StatCell
            label="Total incidents (SSOT)"
            value={stats.totalIncidents}
            tone="fraud-kpi--warn"
          />
          <StatCell label="Suspicions aujourd'hui" value={stats.suspicionsToday} tone="fraud-kpi--warn" />
          <StatCell label="Critiques (total)" value={stats.criticalIncidents} tone="fraud-kpi--critical" />
          <StatCell label="Critiques aujourd'hui" value={stats.criticalToday} tone="fraud-kpi--critical" />
          <StatCell label="Importants aujourd'hui" value={stats.importantToday} tone="fraud-kpi--warn" />
          <StatCell label="Faibles aujourd'hui" value={stats.attentionToday} />
          <StatCell label="Fraudes confirmées" value={stats.confirmedFraudToday} tone="fraud-kpi--critical" />
          <StatCell label="Comptes à surveiller" value={stats.watchAccounts} />
        </Zone>

        <Zone title="Qualité" icon="✨">
          <StatCell label="Écoutes valides" value={stats.validListensToday} tone="fraud-kpi--ok" />
          <StatCell label="Écoutes rejetées" value={stats.rejectedListensToday} tone="fraud-kpi--warn" />
          <StatCell
            label="Taux de réussite"
            value={stats.listenSuccessRate}
            tone="fraud-kpi--ok"
            suffix="%"
          />
          <StatCell label="Signalées aujourd'hui" value={stats.fraudDetectedToday} />
        </Zone>
      </div>
    </section>
  );
}

export const FraudSupervisionDashboard = memo(FraudSupervisionDashboardView);
