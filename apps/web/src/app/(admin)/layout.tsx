import { Suspense } from "react";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { getAdminSessionContext } from "@/features/admin/lib/getAdminSessionContext";
import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { AdminLayoutShell } from "@/features/admin/components/AdminLayoutShell";
import AdminLoading from "./loading";
import "@/app/styles/admin.css";

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const admin = await getAdminServiceForSession();
  const [navBadges, adminUser] = await Promise.all([
    admin.getNavBadges().catch(() => ({
      content: 0,
      pendingRightsClaims: 0,
      fraudSessions: 0,
      withdrawals: 0,
    })),
    getAdminSessionContext(),
  ]);

  return (
    <AdminLayoutShell navBadges={navBadges} adminUser={adminUser}>
      {children}
    </AdminLayoutShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
