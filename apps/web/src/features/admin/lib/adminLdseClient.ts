import type {
  AdminAnalyticsDashboard,
  AdminFraudSupervisionStats,
  AdminLiveSnapshot,
} from "@sonafrik/api/admin";

async function fetchAdminLdse<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Admin LDSE refresh failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Stable URL — évite UnrecognizedActionError après HMR / redémarrage dev. */
export function fetchAdminLiveSnapshot(): Promise<AdminLiveSnapshot> {
  return fetchAdminLdse<AdminLiveSnapshot>("/api/admin/ldse/snapshot");
}

export function fetchAdminAnalyticsDashboard(): Promise<AdminAnalyticsDashboard> {
  return fetchAdminLdse<AdminAnalyticsDashboard>("/api/admin/ldse/analytics");
}

export function fetchFraudSupervisionStats(): Promise<AdminFraudSupervisionStats> {
  return fetchAdminLdse<AdminFraudSupervisionStats>("/api/admin/ldse/fraud-supervision");
}
