import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminFraudCenter } from "@/features/admin/components/AdminFraudCenter";

export const metadata = { title: "Fraude — Admin SONAFRIK" };

export default async function AdminFraudPage() {
  const admin = await getAdminServiceForSession();
  const [initialPage, stats] = await Promise.all([
    admin.listFraudIncidentsPage(200, 0),
    admin.getFraudSupervisionStats(),
  ]);

  return (
    <AdminPageFrame
      title="Supervision fraude"
      subtitle="Centre de supervision humain — écoutes et incidents en temps réel"
    >
      <AdminFraudCenter initialPage={initialPage} stats={stats} />
    </AdminPageFrame>
  );
}
