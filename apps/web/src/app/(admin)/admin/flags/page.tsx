import { getAdminServiceWithServiceRole } from "@/features/admin/lib/getAdminService";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminFlagsCenter } from "@/features/admin/components/AdminFlagsCenter";

export const metadata = { title: "Feature Flags — Admin SONAFRIK" };

export default async function AdminFlagsPage() {
  const admin = await getAdminServiceWithServiceRole();
  const flags = await admin.listFeatureFlags().catch(() => []);

  return (
    <AdminPageFrame title="Feature Flags" subtitle="Activation des fonctionnalités plateforme">
      <AdminFlagsCenter flags={flags} />
    </AdminPageFrame>
  );
}
