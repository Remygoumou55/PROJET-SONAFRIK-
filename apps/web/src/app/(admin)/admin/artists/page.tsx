import { Suspense } from "react";
import type { AdminArtistsFilter } from "@sonafrik/types";
import { AdminArtistsClient } from "@/features/admin/components/AdminArtistsClient";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";

export const dynamic = "force-dynamic";
export const metadata = { title: "Artistes — Admin SONAFRIK" };

interface AdminArtistsPageProps {
  searchParams: Promise<{
    q?: string;
    filter?: string;
    page?: string;
  }>;
}

function parseFilter(value?: string): AdminArtistsFilter | undefined {
  if (
    value === "pending" ||
    value === "verified" ||
    value === "tier_etabli" ||
    value === "suspended" ||
    value === "all"
  ) {
    return value;
  }
  return undefined;
}

export default async function AdminArtistsPage({ searchParams }: AdminArtistsPageProps) {
  const params = await searchParams;
  const admin = await getAdminServiceForSession();
  const filter = parseFilter(params.filter);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const data = await admin.listArtists({
    q: params.q,
    filter: filter === "all" ? undefined : filter,
    page,
  });

  return (
    <AdminPageFrame
      title="Artistes"
      subtitle={`${data.total.toLocaleString("fr-FR")} artiste${data.total > 1 ? "s" : ""} sur SONAFRIK`}
    >
      <Suspense fallback={null}>
        <AdminArtistsClient
          artists={data.artists}
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
