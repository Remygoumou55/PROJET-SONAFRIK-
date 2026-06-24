import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminFraudCenter } from "@/features/admin/components/AdminFraudCenter";

export const metadata = { title: "Fraude — Admin SONAFRIK" };

export default async function AdminFraudPage() {
  const admin = await getAdminServiceForSession();
  const sessions = await admin.listFraudSessions();

  return <AdminFraudCenter sessions={sessions} />;
}
