import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { AdminPageFrame } from "@/features/admin/components/AdminPageFrame";
import { AdminFraudCenter } from "@/features/admin/components/AdminFraudCenter";

export const metadata = { title: "Fraude — Admin SONAFRIK" };

export default async function AdminFraudPage() {
  const admin = await getAdminServiceForSession();
  const sessions = await admin.listFraudSessions();

  return (
    <AdminPageFrame title="Fraude streaming" subtitle="Sessions avec fraud_flags actifs">
      <AdminFraudCenter sessions={sessions} />
    </AdminPageFrame>
  );
}
