import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminCockpitDashboard } from "@/features/admin/components/AdminCockpitDashboard";

export const metadata = { title: "Dashboard Admin — SONAFRIK" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminServiceForSession();
  const data = await admin.getCockpitData();

  return <AdminCockpitDashboard data={data} />;
}
