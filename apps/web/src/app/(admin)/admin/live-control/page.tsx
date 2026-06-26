import { getAdminServiceWithServiceRole } from "@/features/admin/lib/getAdminService";
import { LiveControlDashboard } from "@/features/admin/components/LiveControlDashboard";

export const metadata = { title: "Live Control MVP — Admin SONAFRIK" };
export const dynamic = "force-dynamic";

export default async function LiveControlPage() {
  const admin = await getAdminServiceWithServiceRole();
  const data = await admin.getLiveControlSnapshot();

  return <LiveControlDashboard data={data} />;
}
