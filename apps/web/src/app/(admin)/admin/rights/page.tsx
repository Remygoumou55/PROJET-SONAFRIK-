import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminRightsCenter } from "@/features/admin/components/AdminRightsCenter";

export const metadata = { title: "Modération — Admin SONAFRIK" };

export default async function AdminRightsPage() {
  const admin = await getAdminServiceForSession();
  const initialClaims = await admin.listRightsClaims();

  return (
    <AdminPageFrame title="Modération" subtitle="Réclamations de droits en attente">
      <AdminRightsCenter initialClaims={initialClaims} />
    </AdminPageFrame>
  );
}
