import { getAdminServiceWithServiceRole } from "@/features/admin/lib/getAdminService";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminSettingsCenter } from "@/features/admin/components/AdminSettingsCenter";

export const metadata = { title: "Config Règles — Admin SONAFRIK" };

export default async function AdminSettingsPage() {
  const admin = await getAdminServiceWithServiceRole();
  const settings = await admin.listSystemSettings().catch(() => []);

  return (
    <AdminPageFrame title="Config Règles Métiers" subtitle="Paramètres système et règles financières">
      <AdminSettingsCenter settings={settings} />
    </AdminPageFrame>
  );
}
