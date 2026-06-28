import { Suspense } from "react";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { getAdminSessionContext } from "@/features/admin/lib/getAdminSessionContext";
import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { isDevBypassActive } from "@/lib/auth/guards";
import { AdminLayoutShell } from "@/features/admin/components/AdminLayoutShell";
import AdminLoading from "./loading";
/* Charge admin CSS sur la route — globals.css seul ne suffit pas en dev (HMR / nested @import). */
import "@/app/styles/admin.css";
import "@/app/styles/admin-dashboard-human.css";
import "@/app/styles/admin-responsive.css";
import "@/app/styles/admin-fraud-human.css";

export const dynamic = "force-dynamic";

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
    <AdminLayoutShell
      navBadges={navBadges}
      adminUser={adminUser}
      disableLiveRealtime={isDevBypassActive()}
    >
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
