import type {
  AdminCockpitData,
  AdminDashboardKpis,
  AdminLiveSnapshot,
} from "@sonafrik/api/admin";

/** Fusionne les données SSR cockpit/KPIs avec le snapshot LDSE live (SSOT client). */
export function mergeAdminLiveData(
  cockpit: AdminCockpitData,
  extended: AdminDashboardKpis,
  snapshot: Pick<
    AdminLiveSnapshot,
    "fraudMetrics" | "moderationMetrics" | "userMetrics" | "navBadges"
  >,
): { cockpit: AdminCockpitData; extended: AdminDashboardKpis } {
  const { fraudMetrics, moderationMetrics, userMetrics } = snapshot;

  const mergedCockpit: AdminCockpitData = {
    ...cockpit,
    kpis: {
      ...cockpit.kpis,
      totalUsers: userMetrics.totalUsers,
      newUsersToday: userMetrics.newUsersToday,
      premiumUsers: userMetrics.premiumUsers,
      activeArtists: userMetrics.activeArtists,
      newArtistsThisWeek: userMetrics.newArtistsThisWeek,
    },
    alerts: {
      ...cockpit.alerts,
      pendingRightsClaims: moderationMetrics.pendingRightsClaims,
      pendingWithdrawals: moderationMetrics.pendingWithdrawals,
      pendingArtistVerif: moderationMetrics.pendingArtistVerifications,
      pendingCatalog: moderationMetrics.pendingCatalog,
      fraudSessions: fraudMetrics.flaggedThisMonth,
    },
  };

  const mergedExtended: AdminDashboardKpis = {
    ...extended,
    totalUsers: userMetrics.totalUsers,
    premiumUsers: userMetrics.premiumUsers,
    pendingCatalog: moderationMetrics.pendingCatalog,
    pendingWithdrawals: moderationMetrics.pendingWithdrawals,
    fraudSessions: fraudMetrics.totalFlagged,
  };

  return { cockpit: mergedCockpit, extended: mergedExtended };
}

export function pickLdseOverlay(
  snapshot: AdminLiveSnapshot,
): Pick<AdminLiveSnapshot, "fraudMetrics" | "moderationMetrics" | "userMetrics" | "navBadges"> {
  return {
    fraudMetrics: snapshot.fraudMetrics,
    moderationMetrics: snapshot.moderationMetrics,
    userMetrics: snapshot.userMetrics,
    navBadges: snapshot.navBadges,
  };
}

export function fraudSessionsTotal(
  fraudMetrics: AdminLiveSnapshot["fraudMetrics"],
  extended: AdminDashboardKpis,
): number {
  return fraudMetrics.totalFlagged || extended.fraudSessions;
}
