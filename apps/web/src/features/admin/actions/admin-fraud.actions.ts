"use server";

import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";

export async function loadFraudIncidentsPageAction(offset: number, limit = 200) {
  const admin = await getAdminServiceForSession();
  return admin.listFraudIncidentsPage(limit, offset);
}

export async function loadFraudSessionEventsAction(sessionId: string) {
  const admin = await getAdminServiceForSession();
  return admin.listFraudSessionEvents(sessionId);
}
