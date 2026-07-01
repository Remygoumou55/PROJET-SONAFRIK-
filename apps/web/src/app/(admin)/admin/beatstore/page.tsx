import { AdminBeatStoreClient } from "@/features/admin/components/AdminBeatStoreClient";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { requireAdminFeatureFlag } from "@/features/admin/lib/requireAdminFeatureFlag";
import { isValidContentName } from "@/lib/content-filter";

export const metadata = { title: "Beat Store — Admin SONAFRIK" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ filter?: string; page?: string }>;
};

function parseFilter(value: string | undefined): "pending" | "published" | "rejected" {
  if (value === "published" || value === "rejected") return value;
  return "pending";
}

export default async function AdminBeatstorePage({ searchParams }: PageProps) {
  await requireAdminFeatureFlag("beat_store_admin");
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const admin = await getAdminServiceForSession();
  let dashboard: Awaited<ReturnType<typeof admin.getBeatStoreDashboard>>;
  let loadError: string | null = null;

  try {
    const raw = await admin.getBeatStoreDashboard({ filter, page, limit: 25 });
    dashboard = {
      ...raw,
      beats: raw.beats.filter(
        (b) => isValidContentName(b.title) && isValidContentName(b.stageName),
      ),
    };
  } catch {
    loadError = "Impossible de charger le Beat Store.";
    dashboard = {
      beats: [],
      total: 0,
      page,
      limit: 25,
      currentFilter: filter,
      counts: { pending: 0, published: 0, rejected: 0 },
      totalRevenue: 0,
    };
  }

  return (
    <>
      {loadError && <p className="admin-inline-error">{loadError}</p>}
      <AdminBeatStoreClient {...dashboard} />
    </>
  );
}
