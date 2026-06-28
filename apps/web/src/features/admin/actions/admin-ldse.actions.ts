"use server";

import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import type { AdminLiveSnapshot } from "@sonafrik/api/admin";

/** Rafraîchit le snapshot admin canonique (badges + métriques fraude). */
export async function refreshAdminLiveSnapshotAction(): Promise<AdminLiveSnapshot> {
  const admin = await getAdminServiceForSession();
  return admin.getAdminLiveSnapshot();
}
