/** Clés de cache LDSE — domaine admin */
export const ADMIN_LDSE_KEYS = {
  liveSnapshot: "admin:live-snapshot",
  navBadges: "admin:nav-badges",
  fraudMetrics: "admin:fraud-metrics",
  moderationMetrics: "admin:moderation-metrics",
  userMetrics: "admin:user-metrics",
} as const;

/** Événements métier admin — Event Bus LDSE */
export const ADMIN_LDSE_EVENTS = {
  snapshotRefreshed: "admin.snapshot.refreshed",
  snapshotInvalidate: "admin.snapshot.invalidate",
  fraudUpdated: "fraud.updated",
  fraudCreated: "fraud.created",
  userUpdated: "admin.user.updated",
  catalogUpdated: "admin.catalog.updated",
  withdrawalUpdated: "admin.withdrawal.updated",
  rightsUpdated: "admin.rights.updated",
} as const;

/** Mappe les tables Supabase Realtime → événements LDSE */
export function mapAdminRealtimeTableToEvents(table: string): string[] {
  switch (table) {
    case "stream_sessions":
      return [ADMIN_LDSE_EVENTS.fraudUpdated, ADMIN_LDSE_EVENTS.snapshotInvalidate];
    case "profiles":
    case "artist_profiles":
    case "creators":
      return [ADMIN_LDSE_EVENTS.userUpdated, ADMIN_LDSE_EVENTS.snapshotInvalidate];
    case "albums":
    case "tracks":
      return [ADMIN_LDSE_EVENTS.catalogUpdated, ADMIN_LDSE_EVENTS.snapshotInvalidate];
    case "withdrawals":
      return [ADMIN_LDSE_EVENTS.withdrawalUpdated, ADMIN_LDSE_EVENTS.snapshotInvalidate];
    case "rights_claims":
      return [ADMIN_LDSE_EVENTS.rightsUpdated, ADMIN_LDSE_EVENTS.snapshotInvalidate];
    case "wallet_ledger":
      return [ADMIN_LDSE_EVENTS.snapshotInvalidate];
    case "creator_verifications":
    case "audit_logs":
      return [ADMIN_LDSE_EVENTS.snapshotInvalidate];
    default:
      return [ADMIN_LDSE_EVENTS.snapshotInvalidate];
  }
}
