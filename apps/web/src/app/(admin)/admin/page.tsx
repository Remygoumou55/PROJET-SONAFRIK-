import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminDashboard } from "@/features/admin/components/AdminDashboard";

export const metadata = { title: "Dashboard Admin — SONAFRIK" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminServiceForSession();
  const kpis = await admin.getDashboardKpis();

  return <AdminDashboard kpis={kpis} />;
}
