import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminPageSkeleton } from "@/features/admin/components/AdminPageSkeleton";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";

const AdminAuditClient = nextDynamic(
  () => import("@/features/admin/components/AdminAuditClient").then((m) => ({ default: m.AdminAuditClient })),
  { loading: () => <AdminPageSkeleton variant="list" rows={12} /> },
);

export const dynamic = "force-dynamic";
export const metadata = { title: "Journal Audit — Admin SONAFRIK" };

interface AdminAuditPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const params = await searchParams;
  const admin = await getAdminServiceForSession();
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const { entries, total } = await admin.listAuditLogs({
    limit,
    offset,
    actionQuery: params.q,
  });

  return (
    <AdminPageFrame
      title="Journal Audit"
      subtitle="Historique des actions plateforme — lecture seule"
    >
      <Suspense fallback={<AdminPageSkeleton variant="list" rows={12} />}>
        <AdminAuditClient initialEntries={entries} total={total} initialQuery={params.q} />
      </Suspense>
    </AdminPageFrame>
  );
}
