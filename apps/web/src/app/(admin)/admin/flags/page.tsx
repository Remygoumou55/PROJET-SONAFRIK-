import { getAdminServiceWithServiceRole } from "@/features/admin/lib/getAdminService";
import { AdminFlagsCenter } from "@/features/admin/components/AdminFlagsCenter";

export const metadata = { title: "Feature Flags — Admin SONAFRIK" };

export default async function AdminFlagsPage() {
  const admin = await getAdminServiceWithServiceRole();
  const flags = await admin.listFeatureFlags().catch(() => []);

  return <AdminFlagsCenter flags={flags} />;
}
