import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { getAdminSessionContext } from "@/features/admin/lib/getAdminSessionContext";
import { AdminCockpitDashboard } from "@/features/admin/components/AdminCockpitDashboard";

export const metadata = { title: "Centre de Commandement — Admin SONAFRIK" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminServiceForSession();
  const [cockpit, extendedKpis, health, live, adminUser] = await Promise.all([
    admin.getCockpitData(),
    admin.getDashboardKpis(),
    admin.getHealthSnapshot().catch(() => null),
    admin.getLiveControlSnapshot().catch(() => null),
    getAdminSessionContext(),
  ]);

  return (
    <AdminCockpitDashboard
      cockpit={cockpit}
      extendedKpis={extendedKpis}
      health={health}
      live={live}
      adminUser={adminUser}
    />
  );
}
