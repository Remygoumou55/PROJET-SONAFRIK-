import type { AdminCockpitData } from "@sonafrik/api/admin";

export type AdminDashboardTrend = "up" | "down" | "neutral";

export interface AdminPremiumKpiView {
  id: string;
  title: string;
  value: string;
  icon: string;
  href: string;
  todayLabel: string;
  periodLabel: string;
  humanInsight: string;
  trend: AdminDashboardTrend;
  sparkline: number[];
  alert?: boolean;
  alertMessage?: string;
  actionLabel?: string;
}

export interface AdminPriorityItem {
  id: string;
  label: string;
  count: number;
  urgency: "critical" | "warning" | "info";
  href: string;
  actionLabel: string;
}

export interface AdminTimelineItem {
  id: string;
  label: string;
  time: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
}

export interface AdminCoachTip {
  id: string;
  text: string;
  cta: string;
  href: string;
  color: string;
}

export interface AdminCategorizedAlert {
  id: string;
  count: number;
  label: string;
  icon: string;
  severity: "danger" | "warning" | "info" | "neutral";
  href: string;
  cta: string;
}

export interface AdminLaunchTargetView {
  label: string;
  current: number;
  target: number;
  unit: string;
  icon: string;
  href: string;
}

export interface AdminHealthServiceView {
  id: string;
  label: string;
  ok: boolean;
  latencyMs?: number;
  detail: string;
}

export interface AdminModuleHumanView {
  href: string;
  icon: string;
  label: string;
  desc: string;
  stat: string;
  activity: string;
  status: "ok" | "attention" | "live";
}

export interface AdminDashboardViewModel {
  hero: {
    greeting: string;
    headline: string;
    narrative: string;
    platformStatus: "excellent" | "stable" | "attention";
    criticalAlerts: number;
    actionsRequired: number;
    healthSummary: string;
  };
  kpis: AdminPremiumKpiView[];
  categorizedAlerts: AdminCategorizedAlert[];
  launchTargets: AdminLaunchTargetView[];
  priorities: AdminPriorityItem[];
  coachTips: AdminCoachTip[];
  timeline: AdminTimelineItem[];
  healthServices: AdminHealthServiceView[];
  modules: AdminModuleHumanView[];
  musical: {
    topTrack: string | null;
    publishedCount: number;
    validListens: number;
    dominantRegion: string;
    narrative: string;
  };
  business: {
    revenueChange: string | null;
    revenuePerUser: string;
    sonafrikShare: string;
    pendingWithdrawals: number;
    ledgerEntries: number;
    narrative: string;
  };
  governance: {
    fraudSessions: number;
    pendingClaims: number;
    pendingVerif: number;
    pendingCatalog: number;
    narrative: string;
  };
  monthlyRevenue: AdminCockpitData["monthlyRevenue"];
}
