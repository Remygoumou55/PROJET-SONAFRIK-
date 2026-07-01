import { getAdminServiceWithServiceRole } from "@/features/admin/lib/getAdminService";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminBusinessRulesCenter } from "@/features/admin/components/AdminBusinessRulesCenter";

export const metadata = { title: "Config Règles — Admin SONAFRIK" };

async function loadActorLabels(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  await requireAdmin();
  const supabase = getSupabaseAdminClient({ adminVerified: true });
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, stage_name, email")
    .in("id", ids);
  const labels: Record<string, string> = {};
  for (const row of data ?? []) {
    const name =
      (row.full_name as string | null)?.trim() ||
      (row.stage_name as string | null)?.trim() ||
      (row.email as string | null)?.split("@")[0] ||
      "Administrateur";
    labels[row.id as string] = name;
  }
  return labels;
}

export default async function AdminSettingsPage() {
  const admin = await getAdminServiceWithServiceRole();
  const [settings, auditHistory] = await Promise.all([
    admin.listSystemSettings().catch(() => []),
    admin.listSystemSettingAuditHistory(150).catch(() => []),
  ]);

  const actorIds = new Set<string>();
  for (const s of settings) {
    if (s.updated_by) actorIds.add(s.updated_by);
  }
  for (const entry of auditHistory) {
    if (entry.actorId) actorIds.add(entry.actorId);
  }
  const actorLabels = await loadActorLabels([...actorIds]);

  return (
    <AdminPageFrame
      title="Config Règles Métiers"
      subtitle="Centre de pilotage stratégique — règles financières et streaming"
    >
      <AdminBusinessRulesCenter
        settings={settings}
        auditHistory={auditHistory}
        actorLabels={actorLabels}
      />
    </AdminPageFrame>
  );
}
