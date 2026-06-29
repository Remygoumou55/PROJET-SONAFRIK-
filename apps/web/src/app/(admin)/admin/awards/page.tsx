import { AdminAwardsClient } from "@/features/admin/components/AdminAwardsClient";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { isValidContentName } from "@/lib/content-filter";
import type { AdminAwardsDashboard } from "@sonafrik/api/admin";

export const metadata = { title: "Awards — Admin SONAFRIK" };
export const dynamic = "force-dynamic";

const EMPTY: AdminAwardsDashboard = {
  activeEdition: null,
  nomineesByCategory: {},
  totalNominees: 0,
  fundBalance: 0,
  fundHistory: [],
  pastEditions: [],
  categories: [],
};

export default async function AdminAwardsPage() {
  const admin = await getAdminServiceForSession();
  let data = EMPTY;
  let loadError: string | null = null;

  try {
    const raw = await admin.getAwardsDashboard();
    const nomineesByCategory: AdminAwardsDashboard["nomineesByCategory"] = {};
    let totalNominees = 0;

    for (const [cat, nominees] of Object.entries(raw.nomineesByCategory)) {
      const filtered = nominees.filter((n) => isValidContentName(n.stageName));
      if (filtered.length > 0) {
        nomineesByCategory[cat] = filtered;
        totalNominees += filtered.length;
      }
    }

    data = {
      ...raw,
      nomineesByCategory,
      totalNominees,
      categories: raw.categories.filter((c) => isValidContentName(c.name)),
    };
  } catch {
    loadError = "Impossible de charger le module Awards.";
  }

  return (
    <>
      {loadError && <p className="admin-inline-error">{loadError}</p>}
      <AdminAwardsClient data={data} />
    </>
  );
}
