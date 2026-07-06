import nextDynamic from "next/dynamic";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminPageSkeleton } from "@/features/admin/components/AdminPageSkeleton";
import { DEFAULT_FRAUD_FILTERS } from "@/features/admin/lib/fraud/useFraudIncidentFilters";

const AdminFraudCenter = nextDynamic(
  () => import("@/features/admin/components/AdminFraudCenter").then((m) => ({ default: m.AdminFraudCenter })),
  { loading: () => <AdminPageSkeleton variant="cards" /> },
);

export const metadata = { title: "Fraude — Admin SONAFRIK" };

export default async function AdminFraudPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const initialFilters =
    sp.filter === "fraud"
      ? { ...DEFAULT_FRAUD_FILTERS, category: "fraud" as const }
      : DEFAULT_FRAUD_FILTERS;

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
      <AdminFraudCenter initialPage={initialPage} stats={stats} initialFilters={initialFilters} />
    </AdminPageFrame>
  );
}
