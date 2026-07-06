import { Suspense } from "react";
import type { AdminUsersFilter } from "@sonafrik/types";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminPageSkeleton } from "@/features/admin/components/AdminPageSkeleton";
import { AdminUsersClient } from "@/features/admin/components/AdminUsersClient";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";

export const dynamic = "force-dynamic";
export const metadata = { title: "Utilisateurs — Admin SONAFRIK" };

interface AdminUsersPageProps {
  searchParams: Promise<{
    q?: string;
    filter?: string;
    page?: string;
  }>;
}

function parseFilter(value?: string): AdminUsersFilter | undefined {
  if (value === "premium" || value === "suspended" || value === "new" || value === "all") {
    return value;
  }
  return undefined;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const admin = await getAdminServiceForSession();
  const filter = parseFilter(params.filter);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const data = await admin.listUsers({
    q: params.q,
    filter: filter === "all" ? undefined : filter,
    page,
  });

  return (
    <AdminPageFrame
      title="Utilisateurs"
      subtitle={`${data.total.toLocaleString("fr-FR")} auditeur${data.total > 1 ? "s" : ""} inscrits sur SONAFRIK`}
    >
      <Suspense fallback={<AdminPageSkeleton variant="list" rows={10} />}>
        <AdminUsersClient
          users={data.users}
          total={data.total}
          page={data.page}
          limit={data.limit}
          currentFilter={filter}
          currentQuery={params.q}
        />
      </Suspense>
    </AdminPageFrame>
  );
}
