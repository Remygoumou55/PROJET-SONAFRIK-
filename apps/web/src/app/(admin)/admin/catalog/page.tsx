import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminCatalogCenter } from "@/features/admin/components/AdminCatalogCenter";

export const metadata = { title: "Contenus — Admin SONAFRIK" };
export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const admin = await getAdminServiceForSession();
  let items: Awaited<ReturnType<typeof admin.listPendingCatalogItems>> = [];
  let loadError: string | null = null;

  try {
    items = await admin.listPendingCatalogItems();
  } catch {
    loadError = "Impossible de charger la file de modération. Réessayez dans un instant.";
  }

  return (
    <AdminPageFrame
      title="Contenus"
      subtitle={
        loadError
          ? "Erreur de chargement"
          : `${items.length} soumission${items.length !== 1 ? "s" : ""} en attente`
      }
    >
      <AdminCatalogCenter initialItems={items} loadError={loadError} />
    </AdminPageFrame>
  );
}
