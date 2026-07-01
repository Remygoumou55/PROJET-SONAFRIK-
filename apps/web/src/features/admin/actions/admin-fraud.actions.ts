"use server";

import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function getAdminUserId(): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    throw new Error("admin_session_required");
  }
  return data.user.id;
}

export async function loadFraudIncidentsPageAction(offset: number, limit = 200) {
  const admin = await getAdminServiceForSession();
  return admin.listFraudIncidentsPage(limit, offset);
}

export async function loadFraudSessionEventsAction(sessionId: string) {
  const admin = await getAdminServiceForSession();
  return admin.listFraudSessionEvents(sessionId);
}

export async function loadFraudReviewStatesAction() {
  const admin = await getAdminServiceForSession();
  const adminUserId = await getAdminUserId();
  const store = await admin.listFraudReviewStates(adminUserId);
  const mapped: Record<
    string,
    { treated: boolean; archived: boolean; hidden: boolean; notes: string[]; updatedAt: string }
  > = {};
  for (const [incidentId, state] of Object.entries(store)) {
    mapped[incidentId] = state;
  }
  return mapped;
}

export async function patchFraudReviewStateAction(
  incidentId: string,
  patch: Partial<{ treated: boolean; archived: boolean; hidden: boolean; notes: string[] }>,
) {
  const admin = await getAdminServiceForSession();
  const adminUserId = await getAdminUserId();
  return admin.upsertFraudReviewState(adminUserId, incidentId, patch);
}

export async function bulkPatchFraudReviewStatesAction(
  incidentIds: string[],
  patch: Partial<{ treated: boolean; archived: boolean; hidden: boolean }>,
) {
  const admin = await getAdminServiceForSession();
  const adminUserId = await getAdminUserId();
  await admin.bulkUpsertFraudReviewStates(adminUserId, incidentIds, patch);
}

export async function addFraudReviewNoteAction(incidentId: string, note: string) {
  const trimmed = note.trim();
  if (!trimmed) return null;
  const admin = await getAdminServiceForSession();
  const adminUserId = await getAdminUserId();
  const existing = await admin.listFraudReviewStates(adminUserId);
  const prev = existing[incidentId];
  const notes = [...(prev?.notes ?? []), trimmed];
  return admin.upsertFraudReviewState(adminUserId, incidentId, { notes });
}
