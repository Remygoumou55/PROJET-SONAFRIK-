import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminCatalogCenter } from "@/features/admin/components/AdminCatalogCenter";

export const metadata = { title: "Revue Catalogue — Admin SONAFRIK" };

export default async function AdminCatalogPage() {
  const admin = await getAdminServiceForSession();
  const items = await admin.listPendingCatalogItems();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <AdminCatalogCenter initialItems={items} />
    </div>
  );
}
