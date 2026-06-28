import { getAdminServiceWithServiceRole } from "@/features/admin/lib/getAdminService";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { LiveControlDashboard } from "@/features/admin/components/LiveControlDashboard";

export const metadata = { title: "Live Control MVP — Admin SONAFRIK" };
export const dynamic = "force-dynamic";

export default async function LiveControlPage() {
  const admin = await getAdminServiceWithServiceRole();
  const data = await admin.getLiveControlSnapshot();

  return (
    <AdminPageFrame title="Live Control" subtitle="Chaîne MVP — métriques temps réel">
      <LiveControlDashboard data={data} />
    </AdminPageFrame>
  );
}
