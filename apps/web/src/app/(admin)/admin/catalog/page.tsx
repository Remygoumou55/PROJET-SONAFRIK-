import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminCatalogCenter } from "@/features/admin/components/AdminCatalogCenter";

export const metadata = { title: "Contenus — Admin SONAFRIK" };

export default async function AdminCatalogPage() {
  const admin = await getAdminServiceForSession();
  const items = await admin.listPendingCatalogItems();

  return (
    <AdminPageFrame title="Contenus" subtitle="Revue catalogue — soumissions en attente">
      <AdminCatalogCenter initialItems={items} />
    </AdminPageFrame>
  );
}
