import { getAdminServiceWithServiceRole } from "@/features/admin/lib/getAdminService";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminBusinessRulesCenter } from "@/features/admin/components/AdminBusinessRulesCenter";

export const metadata = { title: "Config Règles — Admin SONAFRIK" };

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
  const actorLabels = await admin.resolveProfileDisplayLabels([...actorIds]);

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
