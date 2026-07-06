import nextDynamic from "next/dynamic";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminPageSkeleton } from "@/features/admin/components/AdminPageSkeleton";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";

const AdminRevenueClient = nextDynamic(
  () => import("@/features/admin/components/AdminRevenueClient").then((m) => ({ default: m.AdminRevenueClient })),
  { loading: () => <AdminPageSkeleton variant="cards" /> },
);

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
