import { getAdminServiceWithServiceRole } from "@/features/admin/lib/getAdminService";
import { AdminSettingsCenter } from "@/features/admin/components/AdminSettingsCenter";

export const metadata = { title: "Paramètres — Admin SONAFRIK" };

export default async function AdminSettingsPage() {
  const admin = await getAdminServiceWithServiceRole();
  const settings = await admin.listSystemSettings().catch(() => []);

  return <AdminSettingsCenter settings={settings} />;
}
