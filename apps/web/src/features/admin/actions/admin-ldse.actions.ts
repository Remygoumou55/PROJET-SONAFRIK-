"use server";

import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import type { AdminAnalyticsDashboard, AdminLiveSnapshot } from "@sonafrik/api/admin";

/**
 * Server Actions réservées aux mutations / formulaires.
 * Le refresh LDSE client passe par `/api/admin/ldse/*` (IDs stables, pas de hash HMR).
 */

/** @deprecated Préférer fetchAdminLiveSnapshot() côté client */
export async function refreshAdminLiveSnapshotAction(): Promise<AdminLiveSnapshot> {
  const admin = await getAdminServiceForSession();
  return admin.getAdminLiveSnapshot();
}

/** @deprecated Préférer fetchAdminAnalyticsDashboard() côté client */
export async function refreshAdminAnalyticsAction(): Promise<AdminAnalyticsDashboard> {
  const admin = await getAdminServiceForSession();
  return admin.getAnalyticsDashboard();
}
