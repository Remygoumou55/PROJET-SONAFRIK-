import type {
  AdminCockpitData,
  AdminDashboardKpis,
  AdminHealthSnapshot,
  LiveControlSnapshot,
} from "@sonafrik/api/admin";
import type { AdminSessionContext } from "../lib/getAdminSessionContext";
import { buildAdminDashboardView } from "../lib/buildAdminDashboardView";
import { AdminCommandHero } from "./dashboard/AdminCommandHero";
import { AdminPremiumKpiGrid } from "./dashboard/AdminPremiumKpiGrid";
import { AdminLiveTimeline } from "./dashboard/AdminLiveTimeline";
import { AdminCategorizedAlerts } from "./dashboard/AdminCategorizedAlerts";
import { AdminLaunchProgress } from "./dashboard/AdminLaunchProgress";
import { AdminCoachCard, AdminPlatformHealthCard } from "./dashboard/AdminCoachHealth";
import {
  AdminModulesHumanGrid,
  AdminStoryChartsSection,
  AdminMusicalTodaySection,
  AdminBusinessSection,
  AdminGovernanceSection,
} from "./dashboard/AdminDashboardSections";

const EMPTY_LIVE: LiveControlSnapshot = {
  totalUsers: 0,
  publishedTracks: 0,
  validListens: 0,
  royaltyCycles: 0,
  ledgerEntries: 0,
  recentTracks: [],
  recentListens: [],
  recentCycles: [],
  recentLedger: [],
};

const EMPTY_HEALTH: AdminHealthSnapshot = { checks: [], alerts: [] };

export interface AdminCockpitDashboardProps {
  cockpit: AdminCockpitData;
  extendedKpis: AdminDashboardKpis;
  health: AdminHealthSnapshot | null;
  live: LiveControlSnapshot | null;
  adminUser: AdminSessionContext;
}

export function AdminCockpitDashboard({
  cockpit,
  extendedKpis,
  health,
  live,
  adminUser,
}: AdminCockpitDashboardProps) {
  const view = buildAdminDashboardView({
    adminName: adminUser.fullName,
    cockpit,
    extended: extendedKpis,
    health: health ?? EMPTY_HEALTH,
    live: live ?? EMPTY_LIVE,
  });

  return (
    <div className="admin-dashboard admin-dashboard--human">
      <AdminCommandHero hero={view.hero} />
      <AdminLaunchProgress targets={view.launchTargets} />
      <AdminPremiumKpiGrid kpis={view.kpis} />

      <div className="admin-human-command-grid">
        <div className="admin-human-command-grid__main">
          <AdminCategorizedAlerts alerts={view.categorizedAlerts} />
          <AdminStoryChartsSection
            monthlyRevenue={view.monthlyRevenue}
            narrative={view.business.narrative}
          />
          <AdminMusicalTodaySection musical={view.musical} />
          <AdminBusinessSection business={view.business} />
          <AdminGovernanceSection governance={view.governance} />
          <AdminModulesHumanGrid modules={view.modules} />
        </div>
        <aside className="admin-human-command-grid__aside">
          <AdminLiveTimeline items={view.timeline} />
          <AdminCoachCard tips={view.coachTips} />
          <AdminPlatformHealthCard services={view.healthServices} />
        </aside>
      </div>
    </div>
  );
}
