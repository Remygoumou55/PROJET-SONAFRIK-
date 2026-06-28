import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminRevenueClient } from "@/features/admin/components/AdminRevenueClient";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revenus — Admin SONAFRIK" };

export default async function AdminRevenuePage() {
  const admin = await getAdminServiceForSession();
  const data = await admin.getRevenueDashboardData();

  return (
    <AdminPageFrame>
      <AdminRevenueClient data={data} />
    </AdminPageFrame>
  );
}
