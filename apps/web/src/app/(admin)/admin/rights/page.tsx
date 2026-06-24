import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminRightsCenter } from "@/features/admin/components/AdminRightsCenter";

export const metadata = { title: "Droits — Admin SONAFRIK" };

export default async function AdminRightsPage() {
  const admin = await getAdminServiceForSession();
  const initialClaims = await admin.listRightsClaims();

  return <AdminRightsCenter initialClaims={initialClaims} />;
}
